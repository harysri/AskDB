const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ error: "not_found", message: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "bad_request", message: "Invalid JSON body" });
  }

  res.status(err.status || 500).json({
    error: "internal_error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong. Please try again."
        : err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
