// Remembers event ids for a short while so a retried or doubled request does not fire a second server event
const DEFAULT_WINDOW_MS = 60 * 1000;
const seen = new Map();

// Returns true if this key was already seen inside the window, otherwise records it
export const seenRecently = (key, windowMs = DEFAULT_WINDOW_MS) => {
  if (!key) return false;
  const now = Date.now();
  if (seen.size > 500) {
    for (const [k, ts] of seen) {
      if (now - ts > Math.max(windowMs, DEFAULT_WINDOW_MS)) seen.delete(k);
    }
  }
  const last = seen.get(key);
  if (last && now - last < windowMs) return true;
  seen.set(key, now);
  return false;
};
