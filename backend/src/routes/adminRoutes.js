import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  activateClient,
  createClient,
  deleteClient,
  deleteClientDocument,
  getAdminStats,
  getClients,
  getClientDocuments,
  getTimelineMessage,
  updateClient,
  uploadClientDocument,
  upsertTimelineMessage,
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads/client-documents");

// Ensure uploads directory exists
import fs from "fs";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/stats", getAdminStats);
router.get("/clients", getClients);
router.get("/timeline", getTimelineMessage);
router.post("/timeline", upsertTimelineMessage);
router.post("/clients", createClient);
router.put("/clients/:id", updateClient);
router.patch("/clients/:id/activate", activateClient);
router.delete("/clients/:id", deleteClient);
router.post(
  "/clients/:clientId/documents",
  upload.single("file"),
  uploadClientDocument,
);
router.get("/clients/:clientId/documents", getClientDocuments);
router.delete("/documents/:documentId", deleteClientDocument);

export default router;
