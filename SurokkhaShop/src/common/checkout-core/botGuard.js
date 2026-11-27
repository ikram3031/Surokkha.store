import { MIN_ACTION_MS } from './config';

const startedAt = typeof performance !== 'undefined' ? performance.now() : 0;
const counters = { cartActions: 0, checkoutActions: 0, humanInputs: 0 };
const firedOnce = new Set();
let listening = false;

// Counts real pointer and key input so scripted sessions without any human input stand out
const listenHumanInput = () => {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const bump = () => { counters.humanInputs += 1; };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, bump, { passive: true, capture: true }));
};

listenHumanInput();

// Waits at least the minimum action time so rapid repeated clicks cannot be fired back to back
export const minDelay = async (work, ms = MIN_ACTION_MS) => {
  const [result] = await Promise.all([work, new Promise((r) => setTimeout(r, ms))]);
  return result;
};

// Records a cart or checkout action for the bot signals
export const noteAction = (kind) => {
  if (kind === 'cart') counters.cartActions += 1;
  else counters.checkoutActions += 1;
};

// Tells whether a keyed event already fired in this page session, marking it as fired
export const firstTime = (key) => {
  if (firedOnce.has(key)) return false;
  firedOnce.add(key);
  return true;
};

// Collects the behaviour and environment signals the server uses to score an order
export const collectClientSignals = (honeypot = '') => {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  return {
    msOnPage: Math.round((typeof performance !== 'undefined' ? performance.now() : 0) - startedAt),
    cartActions: counters.cartActions,
    checkoutActions: counters.checkoutActions,
    humanInputs: counters.humanInputs,
    honeypot: honeypot ? 1 : 0,
    webdriver: nav.webdriver ? 1 : 0,
    platform: nav.platform || '',
    maxTouchPoints: nav.maxTouchPoints || 0,
    screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  };
};
