const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");
const { mongodbUri, rateLimit: rlConfig } = require("../config/env");

/**
 * Builds a rate limiter backed by MongoDB so limits are enforced
 * consistently across multiple gateway instances (horizontal scaling).
 */
function buildLimiter({ windowMs, max, prefix, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoStore({
      uri: mongodbUri,
      collectionName: "rate_limits",
      expireTimeMs: windowMs,
      errorHandler: console.error.bind(null, "rate-limit-mongo error"),
    }),
    // Key by authenticated user when available, otherwise by IP.
    keyGenerator: (req) => `${prefix}:${req.user?.sub || req.ip}`,
    handler: (req, res) => {
      res.status(429).json({
        error: "rate_limited",
        message:
          message ||
          "Too many requests. Please slow down and try again shortly.",
      });
    },
  });
}

// General API traffic (session listing, connection setup, etc.)
const generalLimiter = buildLimiter({
  windowMs: rlConfig.windowMs,
  max: rlConfig.maxRequests,
  prefix: "general",
  message: "Rate limit exceeded for general API usage.",
});

// Tighter limit on chat/query endpoints, since each call triggers
// LLM inference + live database queries downstream.
const chatLimiter = buildLimiter({
  windowMs: rlConfig.windowMs,
  max: rlConfig.chatMaxRequests,
  prefix: "chat",
  message:
    "You're sending questions too quickly. Please wait a moment before asking again.",
});

// Stricter limiter for auth endpoints to slow brute-force attempts.
const authLimiter = buildLimiter({
  windowMs: rlConfig.windowMs,
  max: 10,
  prefix: "auth",
  message: "Too many authentication attempts. Please try again later.",
});

module.exports = { generalLimiter, chatLimiter, authLimiter };
