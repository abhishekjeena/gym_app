import { Router } from "express";
import { createFeedback, getFeedback } from "../controllers/feedbackController.js";
import { getTimelineMessage } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", getFeedback);
router.get("/timeline", getTimelineMessage);
router.post("/", requireAuth, requireRole("client"), createFeedback);

export default router;
