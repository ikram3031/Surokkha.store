#!/usr/bin/env node
// Installs the post-commit hook that runs run.mjs after every commit
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MARK = '# plexihub-commit-docs';
const LINE = `node tools/commit-docs/run.mjs || true ${MARK}`;

// Adds the hook line once, keeping any hook that is already there
const install = () => {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const rel = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { encoding: 'utf8', cwd: root }).trim();
  const hooksDir = isAbsolute(rel) ? rel : join(root, rel);
  mkdirSync(hooksDir, { recursive: true });
  const hook = join(hooksDir, 'post-commit');
  const current = existsSync(hook) ? readFileSync(hook, 'utf8') : '#!/bin/sh\n';
  if (!current.includes(MARK)) writeFileSync(hook, `${current.trimEnd()}\n${LINE}\n`);
  chmodSync(hook, 0o755);
  console.log(`post-commit hook ready: ${hook}`);
  console.log(`Put the Plexi Docs key in ${join(HERE, 'config.json')} (docsKey)`);
};

install();
