import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = new Set(env.clientUrls);
      const isLocalhost =
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/.test(origin);

      if (allowedOrigins.has(origin) || (env.nodeEnv !== "production" && isLocalhost)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser(env.cookieSecret));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/user", userRoutes);
app.use(errorHandler);
