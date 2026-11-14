#!/usr/bin/env node
// Documents the latest commit: sends it to PlexiHub with the Plexi Docs key from config.json.
// Nothing is written into the repo: the pages live in PlexiHub and the docs site reads them from there.
// If PlexiHub is unreachable the commit waits in .git/plexi-docs-queue and is sent with the next one.
// Runs from the post-commit hook; it never fails the commit.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_DIFF = 300_000;
const SUBJECT = /^([A-Z]{1,4}\d+)\(([a-z]+)\):\s*(.*)$/;
const TRAILER = /^(Category|Why|Purpose|Section|Page|Status|Goal):\s*(.*)$/i;

// Runs a git command in the repo and returns its output
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trimEnd();

// Turns an ssh or https remote into the repo's web URL
const webUrl = (remote) =>
  remote
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/^ssh:\/\/git@([^/]+)\//, 'https://$1/')
    .replace(/^https:\/\/[^@/]+@/, 'https://')
    .replace(/\.git$/, '');

// Collects the files of HEAD with their status and line counts
const changedFiles = () => {
  const status = new Map(
    git('show', '--format=', '--name-status', '--no-renames', 'HEAD')
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('\t'))
      .map(([s, p]) => [p, s])
  );
  return git('show', '--format=', '--numstat', '--no-renames', 'HEAD')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .map(([a, d, p]) => ({ path: p, status: status.get(p) || 'M', additions: Number(a) || 0, deletions: Number(d) || 0 }));
};

// Guesses the category from the paths that changed the most lines
const guessCategory = (files, rules) => {
  const score = {};
  for (const f of files) {
    const hit = Object.entries(rules).find(([, prefixes]) => prefixes.some((p) => f.path === p || f.path.startsWith(p)));
    if (hit) score[hit[0]] = (score[hit[0]] || 0) + f.additions + f.deletions + 1;
  }
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
};

// Reads the normal git message — "DC99(feat): subject", Category/Why/Purpose (and Section/Page/Status/Goal for
// docs and plan commits) lines, then the free body — into the Plexi Docs POST fields
const readMessage = (message) => {
  const [first = '', ...rest] = message.replace(/\r\n/g, '\n').split('\n');
  const head = first.trim().match(SUBJECT);
  const fields = {};
  const body = [];
  let current = '';
  for (const line of rest) {
    const t = line.match(TRAILER);
    if (t) {
      current = t[1].toLowerCase();
      fields[current] = t[2].trim();
    } else if (current && ['why', 'purpose', 'goal'].includes(current) && /^\s+\S/.test(line)) {
      fields[current] = `${fields[current]} ${line.trim()}`.trim();
    } else {
      current = '';
      body.push(line);
    }
  }
  return {
    commitId: head?.[1] || '',
    type: head?.[2] || '',
    message: (head?.[3] || first).trim(),
    description: body.join('\n').trim(),
    category: (fields.category || '').toLowerCase(),
    why: fields.why || '',
    purpose: fields.purpose || '',
    section: fields.section || '',
    page: fields.page || '',
    status: (fields.status || '').toLowerCase(),
    goal: fields.goal || '',
  };
};

// Sends one commit body to PlexiHub; throws when it isn't accepted
const send = async (config, body) => {
  const key = String(config.docsKey || '').trim();
  const hubUrl = (config.hubUrl || '').replace(/\/+$/, '');
  if (!key || !hubUrl) throw new Error('docsKey or hubUrl is empty in tools/commit-docs/config.json');
  const res = await fetch(`${hubUrl}/api/commit-docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Docs-Key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs || 10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error?.message || `PlexiHub answered ${res.status}`);
};

// Queues the latest commit, then sends everything waiting (oldest first)
const main = async () => {
  const root = git('rev-parse', '--show-toplevel');
  process.chdir(root);
  const config = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
  const queueDir = join(git('rev-parse', '--absolute-git-dir'), 'plexi-docs-queue');
  const hash = git('rev-parse', 'HEAD');
  const files = changedFiles();
  const rawDiff = git('show', '--format=', '--patch', '--no-color', 'HEAD');
  const rawMessage = git('log', '-1', '--format=%B', 'HEAD');
  const committedAt = git('log', '-1', '--format=%cI', 'HEAD');
  const commit = {
    ...readMessage(rawMessage),
    clientKey: String(config.clientKey || '').toLowerCase(),
    rawMessage,
    ownerDId: config.ownerDId || '',
    project: config.project,
    hash,
    author: git('log', '-1', '--format=%an', 'HEAD'),
    committedAt,
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    repoUrl: (() => {
      try {
        return webUrl(git('remote', 'get-url', 'origin'));
      } catch {
        return '';
      }
    })(),
    files,
    diff: rawDiff.slice(0, MAX_DIFF),
    diffTruncated: rawDiff.length > MAX_DIFF,
    categoryGuess: guessCategory(files, config.categories || {}),
  };

  mkdirSync(queueDir, { recursive: true });
  writeFileSync(join(queueDir, `${Date.parse(committedAt) || Date.now()}-${hash}.json`), JSON.stringify(commit));
  const waiting = readdirSync(queueDir).filter((f) => f.endsWith('.json')).sort();
  let sent = 0;
  for (const name of waiting) {
    const file = join(queueDir, name);
    try {
      await send(config, JSON.parse(readFileSync(file, 'utf8')));
      rmSync(file);
      sent += 1;
    } catch (err) {
      console.warn(`[commit-docs] not sent yet (${err.message}) — ${waiting.length - sent} commit(s) waiting in .git/plexi-docs-queue`);
      return;
    }
  }
  console.log(`[commit-docs] ${sent} commit(s) sent to PlexiHub`);
};

main().catch((err) => {
  console.warn(`[commit-docs] skipped: ${err.message}`);
});
