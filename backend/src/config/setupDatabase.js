import { pool } from "./db.js";
import { applySchema } from "./applySchema.js";
import { hashPassword } from "../utils/password.js";

async function setupDatabase() {
  try {
    await applySchema();
    await seedUsers();
    console.log("Database schema applied successfully.");
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

async function seedUsers() {
  const adminHash = await hashPassword("Admin@123");
  const clientHash = await hashPassword("Client@123");

  await pool.query(
    `INSERT INTO users (
      role, full_name, email, password_hash, phone, gender, age, membership_plan, join_date, gdpr_consent, gdpr_consent_at
    )
    SELECT 'admin', 'Gym Admin', 'admin@gympro.com', $1, '+91 99999 88888', 'Prefer not to say', 32, 'Yearly', CURRENT_DATE, TRUE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gympro.com')`,
    [adminHash]
  );

  await pool.query(
    `INSERT INTO users (
      role, full_name, email, password_hash, phone, gender, age, membership_plan, join_date, gdpr_consent, gdpr_consent_at
    )
    SELECT 'client', 'Demo Client', 'client@gympro.com', $1, '+91 88888 77777', 'Female', 27, 'Monthly', CURRENT_DATE, TRUE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client@gympro.com')`,
    [clientHash]
  );
}

setupDatabase();
