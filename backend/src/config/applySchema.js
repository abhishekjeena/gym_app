import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function applySchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(sql);
}
