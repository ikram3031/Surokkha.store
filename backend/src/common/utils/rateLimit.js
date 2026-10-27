// Tiny in-memory fixed-window limiter, enough to slow down password guessing on a single API process.
const buckets = new Map();

// Returns true while `key` is still under `max` hits within `windowMs`; false once it is rate limited
export const allowHit = (key, { max, windowMs }) => {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
};

export const clearHits = (key) => buckets.delete(key);

// Keeps the map from growing forever
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 10 * 60 * 1000).unref();
