import { query } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import {
  isEmail,
  isStrongName,
  sanitizeUser,
  validatePasswordStrength,
} from "../utils/helpers.js";

export async function getClients(req, res) {
  const result = await query(
    `SELECT id, role, full_name, email, phone, gender, age, membership_plan, join_date, address, profile_image_url, gdpr_consent, is_active, created_at
     FROM users
     WHERE role = 'client'
     ORDER BY created_at DESC`,
  );

  return res.json({ clients: result.rows });
}

export async function createClient(req, res) {
  const {
    fullName,
    email,
    password,
    phone,
    gender,
    age,
    membershipPlan,
    joinDate,
    address,
  } = req.body;

  if (!isStrongName(fullName) || !isEmail(email) || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({ message: "Password is not strong enough." });
  }

  const passwordHash = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (
      role, full_name, email, password_hash, phone, gender, age, membership_plan, join_date, address, gdpr_consent, gdpr_consent_at, is_active
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,NOW(),TRUE)
     RETURNING *`,
    [
      "client",
      fullName.trim(),
      email.toLowerCase(),
      passwordHash,
      phone || null,
      gender || null,
      age || null,
      membershipPlan || "Monthly",
      joinDate || new Date().toISOString().slice(0, 10),
      address || null,
    ],
  );

  return res.status(201).json({
    message: "Client created successfully.",
    client: sanitizeUser(result.rows[0]),
  });
}

export async function updateClient(req, res) {
  const { id } = req.params;
  const { fullName, phone, gender, age, membershipPlan, joinDate, address } =
    req.body;

  const result = await query(
    `UPDATE users
     SET full_name = $1,
         phone = $2,
         gender = $3,
         age = $4,
         membership_plan = $5,
         join_date = $6,
         address = $7,
         updated_at = NOW()
     WHERE id = $8 AND role = 'client'
     RETURNING *`,
    [
      fullName,
      phone,
      gender,
      age,
      membershipPlan,
      joinDate || null,
      address,
      id,
    ],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: "Client not found." });
  }

  return res.json({
    message: "Client updated successfully.",
    client: sanitizeUser(result.rows[0]),
  });
}

export async function deleteClient(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE users
     SET is_active = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND role = 'client'
     RETURNING id`,
    [id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: "Client not found." });
  }

  return res.json({ message: "Client deactivated successfully." });
}

export async function activateClient(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE users
     SET is_active = TRUE,
         updated_at = NOW()
     WHERE id = $1 AND role = 'client'
     RETURNING *`,
    [id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: "Client not found." });
  }

  return res.json({
    message: "Client activated successfully.",
    client: sanitizeUser(result.rows[0]),
  });
}

export async function getAdminStats(req, res) {
  const totalClients = await query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'client' AND is_active = TRUE",
  );
  const totalSchedules = await query(
    "SELECT COUNT(*)::int AS count FROM exercise_schedules",
  );

  return res.json({
    stats: {
      totalClients: totalClients.rows[0].count,
      totalSchedules: totalSchedules.rows[0].count,
    },
  });
}

export async function getTimelineMessage(req, res) {
  const result = await query(
    `SELECT id, content, is_active, updated_at
     FROM site_timeline_messages
     WHERE is_active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
  );

  return res.json({
    timeline: result.rows[0] || null,
  });
}

export async function upsertTimelineMessage(req, res) {
  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({ message: "Timeline content is required." });
  }

  await query(
    `UPDATE site_timeline_messages
     SET is_active = FALSE,
         updated_at = NOW()
     WHERE is_active = TRUE`,
  );

  const result = await query(
    `INSERT INTO site_timeline_messages (content, created_by, is_active)
     VALUES ($1, $2, TRUE)
     RETURNING id, content, is_active, updated_at`,
    [content, req.user.id],
  );

  return res.json({
    message: "Timeline updated successfully.",
    timeline: result.rows[0],
  });
}

export async function uploadClientDocument(req, res) {
  const { clientId, documentName } = req.body;
  const file = req.file;

  if (!clientId || !documentName || !file) {
    return res
      .status(400)
      .json({ message: "Client ID, document name, and file are required." });
  }

  // Verify client exists
  const clientCheck = await query(
    "SELECT id FROM users WHERE id = $1 AND role = 'client'",
    [clientId],
  );

  if (!clientCheck.rows[0]) {
    return res.status(404).json({ message: "Client not found." });
  }

  const result = await query(
    `INSERT INTO client_documents (client_id, uploaded_by, document_name, document_type, file_path, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, client_id, document_name, document_type, file_path, file_size, created_at`,
    [
      clientId,
      req.user.id,
      documentName.trim(),
      file.mimetype,
      file.path,
      file.size,
    ],
  );

  return res.status(201).json({
    message: "Document uploaded successfully.",
    document: result.rows[0],
  });
}

export async function getClientDocuments(req, res) {
  const { clientId } = req.params;

  const result = await query(
    `SELECT id, client_id, document_name, document_type, file_path, file_size, created_at
     FROM client_documents
     WHERE client_id = $1 AND is_deleted = FALSE
     ORDER BY created_at DESC`,
    [clientId],
  );

  return res.json({ documents: result.rows });
}

export async function deleteClientDocument(req, res) {
  const { documentId } = req.params;

  const docResult = await query(
    "SELECT id FROM client_documents WHERE id = $1",
    [documentId],
  );

  if (!docResult.rows[0]) {
    return res.status(404).json({ message: "Document not found." });
  }

  // Soft delete the document
  await query(
    "UPDATE client_documents SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
    [documentId],
  );

  return res.json({ message: "Document deleted successfully." });
}
