const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const env = require("./config/env");
const logger = require("./utils/logger");
const { generalLimiter } = require("./middleware/rateLimiter");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const proxyRoutes = require("./routes/proxy");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  }),
);
app.use(cookieParser());
// NOTE: express.json()/urlencoded() are intentionally NOT applied globally.
// They would consume the POST body stream before http-proxy-middleware can
// forward it, hanging proxied /api/* requests against the FastAPI core.
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }),
);

// Health check (unauthenticated, unlimited — used by load balancers / k8s probes)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "askdb-gateway",
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Public auth routes (register/login/refresh already rate-limited internally)
app.use(
  "/auth",
  express.json({ limit: "1mb" }),
  express.urlencoded({ extended: true }),
  authRoutes,
);

// Everything else goes through general rate limiting + JWT auth,
// then is proxied to the FastAPI core service.
app.use("/api", generalLimiter, proxyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("Connected to MongoDB Atlas");

    const server = app.listen(env.port, () => {
      logger.info(
        `AskDB Gateway listening on port ${env.port} (${env.nodeEnv})`,
      );
      logger.info(`Proxying core requests to ${env.fastapiTargetUrl}`);
    });
    // A second copy looks like a crash; tell the user what is really wrong.
    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        logger.error(
          `Port ${env.port} is already in use — another gateway instance is already running. ` +
            `Stop it first (e.g. kill <pid>) or just reuse the running one; do not start a second copy.`,
        );
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    logger.error("Failed to start gateway", { error: err.message });
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

start();

module.exports = app;
