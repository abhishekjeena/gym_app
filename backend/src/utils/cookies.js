import { isProduction } from "../config/env.js";

export const accessCookieName = "gym_access_token";
export const refreshCookieName = "gym_refresh_token";

export function tokenCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
    path: "/",
  };
}
