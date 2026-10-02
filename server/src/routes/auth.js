const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/tokens");
const { authLimiter } = require("../middleware/rateLimiter");
const logger = require("../utils/logger");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ error: "validation_error", details: errors.array() });
  }
  next();
}

// POST /auth/register
router.post(
  "/register",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("fullName").optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res
          .status(409)
          .json({ error: "conflict", message: "Email already registered" });
      }

      const user = new User({ email, fullName });
      await user.setPassword(password);
      await user.save();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(refreshToken);
      user.lastLoginAt = new Date();
      await user.save();

      res.status(201).json({
        user: user.toSafeJSON(),
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/login
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.isActive || !(await user.verifyPassword(password))) {
        return res
          .status(401)
          .json({ error: "unauthorized", message: "Invalid credentials" });
      }

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(refreshToken);
      user.lastLoginAt = new Date();
      await user.save();

      res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/refresh
router.post(
  "/refresh",
  authLimiter,
  [body("refreshToken").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (err) {
        return res
          .status(401)
          .json({ error: "unauthorized", message: "Invalid refresh token" });
      }

      const user = await User.findById(decoded.sub);
      if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
        return res
          .status(401)
          .json({ error: "unauthorized", message: "Refresh token revoked" });
      }

      const newAccessToken = signAccessToken(user);
      const newRefreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(newRefreshToken);
      await user.save();

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(decoded.sub, { refreshTokenHash: null });
      } catch (err) {
        logger.debug("Logout with already-invalid refresh token, ignoring");
      }
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
