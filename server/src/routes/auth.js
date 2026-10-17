const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/tokens");
const { authLimiter } = require("../middleware/rateLimiter");
const env = require("../config/env");
const { sendOtpEmail } = require("../services/mailer");
const logger = require("../utils/logger");

const router = express.Router();

// 6-digit numeric OTP helpers (only hashes touch the database).
function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${env.otp.pepper}`)
    .digest("hex");
}

function otpMatches(otp, expectedHash) {
  const actual = Buffer.from(hashOtp(otp), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function isOtpUsable(doc) {
  return doc && !doc.consumedAt && doc.expiresAt.getTime() > Date.now();
}

const GENERIC_OTP_SENT = "If an account exists for that email, a verification code was sent.";

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

// POST /auth/send-otp
router.post(
  "/send-otp",
  authLimiter,
  [body("email").isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      // Never reveal whether the email is registered.
      if (!user || !user.isActive) {
        return res.json({ message: GENERIC_OTP_SENT });
      }

      const windowStart = new Date(Date.now() - env.otp.ttlMinutes * 60 * 1000);
      const recentSends = await PasswordResetOtp.countDocuments({
        email,
        createdAt: { $gte: windowStart },
      });
      if (recentSends >= env.otp.maxSendsPerWindow) {
        return res.status(429).json({
          error: "rate_limited",
          message: "Too many codes requested. Please wait a few minutes and try again.",
        });
      }

      // Invalidate any previous active codes for this email.
      await PasswordResetOtp.updateMany(
        { email, consumedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { consumedAt: new Date() } }
      );

      const otp = String(crypto.randomInt(100000, 1000000));
      await PasswordResetOtp.create({
        email,
        otpHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000),
      });

      try {
        await sendOtpEmail(email, otp);
      } catch (err) {
        logger.error("Failed to send password reset OTP email", {
          error: err.message,
        });
      }

      res.json({ message: "OTP sent successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/verify-otp
router.post(
  "/verify-otp",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const doc = await PasswordResetOtp.findOne({
        email,
        consumedAt: null,
      }).sort({ createdAt: -1 });

      if (!doc) {
        return res
          .status(400)
          .json({ error: "invalid_otp", message: "Invalid or expired code." });
      }
      if (doc.expiresAt.getTime() <= Date.now()) {
        return res
          .status(400)
          .json({ error: "expired_otp", message: "Code expired. Please request a new one." });
      }
      if (doc.attempts >= env.otp.maxAttempts) {
        return res.status(429).json({
          error: "too_many_attempts",
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }

      if (!otpMatches(String(otp), doc.otpHash)) {
        doc.attempts += 1;
        await doc.save();
        return res
          .status(400)
          .json({ error: "invalid_otp", message: "Invalid or expired code." });
      }

      doc.verified = true;
      await doc.save();
      res.json({ message: "OTP verified", valid: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/reset-password
router.post(
  "/reset-password",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;
      const doc = await PasswordResetOtp.findOne({
        email,
        verified: true,
        consumedAt: null,
      }).sort({ createdAt: -1 });

      if (!isOtpUsable(doc) || !otpMatches(String(otp), doc.otpHash)) {
        return res
          .status(400)
          .json({ error: "invalid_otp", message: "Invalid or expired code." });
      }

      const user = await User.findOne({ email });
      if (!user || !user.isActive) {
        return res
          .status(400)
          .json({ error: "invalid_otp", message: "Invalid or expired code." });
      }

      await user.setPassword(newPassword);
      // Force re-login everywhere: drop existing refresh sessions.
      user.refreshTokenHash = null;
      await user.save();

      // Single-use: consume this OTP and invalidate any other active ones.
      await PasswordResetOtp.updateMany(
        { email, consumedAt: null },
        { $set: { consumedAt: new Date() } }
      );

      res.json({ message: "Password reset successful" });
    } catch (err) {
      next(err);
    }
  }
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
