import { query } from "../config/db.js";
import { verifyAccessToken } from "../utils/tokens.js";

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies.gym_access_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = verifyAccessToken(token);
    const result = await query("SELECT * FROM users WHERE id = $1", [payload.sub]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid session." });
    }

    if (user.role === "client" && user.is_active === false) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact the admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired or invalid." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  };
}
