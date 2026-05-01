import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: "15m" }
  );
}

export function createRefreshToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

