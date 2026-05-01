import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import {
  accessCookieName,
  refreshCookieName,
  tokenCookieOptions,
} from "../utils/cookies.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import {
  hashResetCode,
  isEmail,
  isStrongName,
  sanitizeUser,
  validatePasswordStrength,
} from "../utils/helpers.js";

function setAuthCookies(res, user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.cookie(accessCookieName, accessToken, tokenCookieOptions(15 * 60 * 1000));
  res.cookie(
    refreshCookieName,
    refreshToken,
    tokenCookieOptions(7 * 24 * 60 * 60 * 1000)
  );

  return { accessToken, refreshToken };
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!isEmail(email) || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const result = await query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.role === "client" && user.is_active === false) {
    return res.status(403).json({ message: "Your account is deactivated. Please contact the admin." });
  }

  const matches = await comparePassword(password, user.password_hash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const { refreshToken } = setAuthCookies(res, user);
  await query("UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2", [
    refreshToken,
    user.id,
  ]);

  return res.json({
    message: "Login successful.",
    user: sanitizeUser(user),
  });
}

export async function registerClient(req, res) {
  const {
    fullName,
    email,
    password,
    phone,
    gender,
    age,
    membershipPlan,
    joinDate,
    gdprConsent,
  } = req.body;

  if (!isStrongName(fullName) || !isEmail(email)) {
    return res.status(400).json({ message: "Valid name and email are required." });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({
      message:
        "Password must be 8+ characters with uppercase, lowercase, number, and symbol.",
    });
  }

  if (!gdprConsent) {
    return res.status(400).json({ message: "Privacy consent is required." });
  }

  const existing = await query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (existing.rowCount > 0) {
    return res.status(409).json({ message: "Account already exists." });
  }

  const passwordHash = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (
      role, full_name, email, password_hash, phone, gender, age, membership_plan, join_date, gdpr_consent, gdpr_consent_at, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),TRUE)
    RETURNING *`,
    [
      "client",
      fullName.trim(),
      email.toLowerCase(),
      passwordHash,
      phone || null,
      gender || null,
      age || null,
      membershipPlan || "Monthly",
      joinDate || new Date().toISOString().slice(0, 10),
      Boolean(gdprConsent),
    ]
  );

  return res.status(201).json({
    message: "Registration successful. Please log in.",
    user: sanitizeUser(result.rows[0]),
  });
}

export async function logout(req, res) {
  if (req.user?.id) {
    await query("UPDATE users SET refresh_token = NULL WHERE id = $1", [req.user.id]);
  }

  res.clearCookie(accessCookieName, tokenCookieOptions(0));
  res.clearCookie(refreshCookieName, tokenCookieOptions(0));

  return res.json({ message: "Logged out." });
}

export async function me(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}

export async function refresh(req, res) {
  try {
    const token = req.cookies[refreshCookieName];
    if (!token) {
      return res.status(401).json({ message: "Refresh token missing." });
    }

    const payload = verifyRefreshToken(token);
    const result = await query("SELECT * FROM users WHERE id = $1", [payload.sub]);
    const user = result.rows[0];

    if (!user || user.refresh_token !== token) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    if (user.role === "client" && user.is_active === false) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact the admin." });
    }

    const { refreshToken } = setAuthCookies(res, user);
    await query("UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: "Unable to refresh session." });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!isEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }

  const result = await query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = result.rows[0];

  if (!user) {
    return res.json({
      message: "If the account exists, reset instructions have been generated.",
    });
  }

  const resetCode = String(Math.floor(100000 + Math.random() * 900000));
  const verificationToken = crypto.randomBytes(24).toString("hex");
  const resetCodeHash = await hashResetCode(resetCode);

  await query(
    `UPDATE users
     SET reset_code_hash = $1,
         reset_code_expires_at = NOW() + INTERVAL '15 minutes',
         reset_verification_token = $2
     WHERE id = $3`,
    [resetCodeHash, verificationToken, user.id]
  );

  return res.json({
    message:
      "Reset code generated. In production, send the code by email or SMS as the second verification step.",
    devResetCode: env.nodeEnv === "development" ? resetCode : undefined,
    verificationToken,
  });
}

export async function resetPassword(req, res) {
  const { email, verificationToken, resetCode, newPassword } = req.body;

  if (!isEmail(email) || !verificationToken || !resetCode || !newPassword) {
    return res.status(400).json({ message: "All reset fields are required." });
  }

  if (!validatePasswordStrength(newPassword)) {
    return res.status(400).json({ message: "Password does not meet security rules." });
  }

  const result = await query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = result.rows[0];

  if (
    !user ||
    !user.reset_verification_token ||
    !user.reset_code_hash ||
    !user.reset_code_expires_at ||
    user.reset_verification_token !== verificationToken
  ) {
    return res.status(400).json({ message: "Invalid reset attempt." });
  }

  const notExpired = new Date(user.reset_code_expires_at).getTime() > Date.now();
  const codeMatches = await bcrypt.compare(resetCode, user.reset_code_hash);

  if (!notExpired || !codeMatches) {
    return res.status(400).json({ message: "Reset code expired or invalid." });
  }

  const newHash = await hashPassword(newPassword);

  await query(
    `UPDATE users
     SET password_hash = $1,
         reset_verification_token = NULL,
         reset_code_hash = NULL,
         reset_code_expires_at = NULL,
         refresh_token = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [newHash, user.id]
  );

  res.clearCookie(accessCookieName, tokenCookieOptions(0));
  res.clearCookie(refreshCookieName, tokenCookieOptions(0));

  return res.json({ message: "Password reset successful. Please log in again." });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }

  if (!validatePasswordStrength(newPassword)) {
    return res.status(400).json({ message: "New password is not strong enough." });
  }

  const matches = await comparePassword(currentPassword, req.user.password_hash);
  if (!matches) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, req.user.id]
  );

  return res.json({ message: "Password changed successfully." });
}
