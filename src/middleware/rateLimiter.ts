import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // increased limit for auth endpoints (allows testing multiple roles)
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
});

