const { verifyAccessToken } = require("../utils/tokens");
const logger = require("../utils/logger");

/**
 * Verifies the Bearer access token on every protected request.
 * On success, attaches `req.user` (decoded claims) and forwards
 * identity headers downstream to the FastAPI service so the core
 * app never has to re-verify JWTs itself.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Missing or malformed Authorization header",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== "access") {
      throw new Error("Not an access token");
    }
    req.user = decoded;

    // Propagate trusted identity to the internal FastAPI service.
    req.headers["x-user-id"] = decoded.sub;
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role;

    next();
  } catch (err) {
    logger.warn("JWT verification failed", { error: err.message });
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid or expired access token",
    });
  }
}

/**
 * Restricts a route to specific roles (e.g. admin-only DB connection setup).
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
