import bcrypt from "bcryptjs";

export function sanitizeUser(user) {
  if (!user) return null;
  const {
    password_hash,
    refresh_token,
    reset_verification_token,
    reset_code_hash,
    reset_code_expires_at,
    ...safeUser
  } = user;
  return safeUser;
}

export function validatePasswordStrength(password) {
  const rule =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  return rule.test(password);
}

export async function hashResetCode(code) {
  return bcrypt.hash(code, 8);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function isStrongName(value) {
  return typeof value === "string" && value.trim().length >= 2;
}
