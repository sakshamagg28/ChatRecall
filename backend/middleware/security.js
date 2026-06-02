const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 300);
const buckets = new Map();

const securityHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

const requestLogger = (req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
};

const rateLimiter = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = buckets.get(key) || { resetAt: now + WINDOW_MS, count: 0 };

  if (bucket.resetAt <= now) {
    bucket.resetAt = now + WINDOW_MS;
    bucket.count = 0;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many requests. Please wait and try again.',
    });
  }

  next();
};

module.exports = {
  rateLimiter,
  requestLogger,
  securityHeaders,
};
