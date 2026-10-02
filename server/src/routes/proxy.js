const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { requireAuth } = require("../middleware/auth");
const { generalLimiter, chatLimiter } = require("../middleware/rateLimiter");
const { fastapiTargetUrl, gatewaySecret } = require("../config/env");
const logger = require("../utils/logger");

const router = express.Router();

const baseProxyOptions = {
  target: fastapiTargetUrl,
  changeOrigin: true,
  // http-proxy-middleware v3 runs with req.url already stripped by Express's
  // "/api" mount (e.g. "/api/connection/test" -> "/test"), so object-form
  // pathRewrite rules never match. Rewrite from the full original URL instead:
  //   /api/chat            -> /chat
  //   /api/connection/test -> /connection/test
  //   /api/sessions/...    -> /sessions/...
  pathRewrite: (path, req) => req.originalUrl.replace(/^\/api/, ""),
  logger: {
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
  },
  on: {
    proxyReq: (proxyReq) => {
      // Prove to the FastAPI core service that this request came through
      // the gateway's auth + rate-limiting layer, not directly from a client.
      proxyReq.setHeader("x-gateway-secret", gatewaySecret);
    },
    error: (err, req, res) => {
      logger.error("Proxy error", { error: err.message });
      res.status(502).json({
        error: "bad_gateway",
        message: "The core analysis service is unavailable. Please try again shortly.",
      });
    },
  },
};


// Chat / query endpoints -> stricter rate limit since they invoke the
// LangGraph agent pipeline (LLM calls + live SQL execution).
router.use(
  "/chat",
  requireAuth,
  chatLimiter,
  createProxyMiddleware(baseProxyOptions)
);

// Database connection management (test/connect/disconnect).
router.use(
  "/connection",
  requireAuth,
  generalLimiter,
  createProxyMiddleware(baseProxyOptions)
);

// Session + chat history management.
router.use(
  "/sessions",
  requireAuth,
  generalLimiter,
  createProxyMiddleware(baseProxyOptions)
);

module.exports = router;
