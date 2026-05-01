import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  registerClient,
  resetPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, registerClient);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);
router.post("/logout", requireAuth, logout);

export default router;

