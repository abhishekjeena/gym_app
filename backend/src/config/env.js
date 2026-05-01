import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "../../", process.env.ENV_FILE || ".env");

dotenv.config({ path: envFilePath });

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/gym_portal",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "change_this_refresh_secret",
  cookieSecret: process.env.COOKIE_SECRET || "change_this_cookie_secret",
};

export const isProduction = env.nodeEnv === "production";
