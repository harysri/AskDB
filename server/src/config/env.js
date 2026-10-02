require("dotenv").config();

const required = (name, fallback = undefined) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

module.exports = {
  port: parseInt(process.env.PORT || "8080", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  fastapiTargetUrl: process.env.FASTAPI_TARGET_URL || "http://localhost:8000",
  gatewaySecret: required("TRUSTED_GATEWAY_HEADER_SECRET", "change_this_shared_secret"),

  mongodbUri: required("MONGODB_URI"),

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60", 10),
    chatMaxRequests: parseInt(
      process.env.RATE_LIMIT_CHAT_MAX_REQUESTS || "15",
      10
    ),
  },

  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(",").map((o) => o.trim()),
};
