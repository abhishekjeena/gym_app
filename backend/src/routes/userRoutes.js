import { Router } from "express";
import {
  createSchedule,
  deleteMyDocument,
  deleteSchedule,
  getMyDocuments,
  getSchedules,
  updateProfile,
  updateSchedule,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../services/uploadService.js";

const router = Router();

router.use(requireAuth);
router.put("/profile", upload.single("profileImage"), updateProfile);
router.get("/schedules", getSchedules);
router.post("/schedules", createSchedule);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);
router.get("/documents", getMyDocuments);
router.delete("/documents/:documentId", deleteMyDocument);

export default router;
