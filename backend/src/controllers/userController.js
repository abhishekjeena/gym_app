import { query } from "../config/db.js";
import { sanitizeUser } from "../utils/helpers.js";

function normalizeExerciseItems(items = []) {
  return items
    .map((item, index) => ({
      exerciseName: item.exerciseName?.trim() || "",
      sets: item.sets ? Number(item.sets) : null,
      reps: item.reps?.trim() || null,
      weight: item.weight?.trim() || null,
      restSeconds: item.restSeconds ? Number(item.restSeconds) : null,
      instructions: item.instructions?.trim() || null,
      sortOrder: index,
    }))
    .filter((item) => item.exerciseName);
}

async function attachExercises(schedules) {
  if (!schedules.length) {
    return [];
  }

  const scheduleIds = schedules.map((schedule) => schedule.id);
  const result = await query(
    `SELECT *
     FROM exercise_schedule_items
     WHERE schedule_id = ANY($1::uuid[])
     ORDER BY sort_order ASC, created_at ASC`,
    [scheduleIds],
  );

  const grouped = new Map();

  for (const item of result.rows) {
    if (!grouped.has(item.schedule_id)) {
      grouped.set(item.schedule_id, []);
    }
    grouped.get(item.schedule_id).push(item);
  }

  return schedules.map((schedule) => ({
    ...schedule,
    exercises: grouped.get(schedule.id) || [],
  }));
}

export async function updateProfile(req, res) {
  const {
    fullName,
    phone,
    gender,
    age,
    membershipPlan,
    emergencyContact,
    address,
  } = req.body;

  const profileImageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : req.user.profile_image_url;

  const result = await query(
    `UPDATE users
     SET full_name = $1,
         phone = $2,
         gender = $3,
         age = $4,
         membership_plan = $5,
         emergency_contact = $6,
         address = $7,
         profile_image_url = $8,
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      fullName,
      phone,
      gender,
      age,
      membershipPlan,
      emergencyContact,
      address,
      profileImageUrl,
      req.user.id,
    ],
  );

  return res.json({
    message: "Profile updated successfully.",
    user: sanitizeUser(result.rows[0]),
  });
}

export async function getSchedules(req, res) {
  const result = await query(
    `SELECT * FROM exercise_schedules
     WHERE user_id = $1
     ORDER BY
       CASE day_of_week
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         WHEN 'Sunday' THEN 7
       END,
       start_time ASC NULLS LAST`,
    [req.user.id],
  );

  const schedules = await attachExercises(result.rows);
  return res.json({ schedules });
}

export async function createSchedule(req, res) {
  const {
    dayOfWeek,
    title,
    category,
    startTime,
    endTime,
    notes,
    exercises = [],
  } = req.body;

  if (!dayOfWeek || !title) {
    return res.status(400).json({ message: "Day and title are required." });
  }

  const normalizedExercises = normalizeExerciseItems(exercises);
  if (!normalizedExercises.length) {
    return res.status(400).json({ message: "Add at least one exercise." });
  }

  const result = await query(
    `INSERT INTO exercise_schedules (
      user_id, day_of_week, title, category, start_time, end_time, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      req.user.id,
      dayOfWeek,
      title,
      category || null,
      startTime || null,
      endTime || null,
      notes || null,
    ],
  );

  for (const item of normalizedExercises) {
    await query(
      `INSERT INTO exercise_schedule_items (
        schedule_id, exercise_name, sets, reps, weight, rest_seconds, instructions, sort_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        result.rows[0].id,
        item.exerciseName,
        item.sets,
        item.reps,
        item.weight,
        item.restSeconds,
        item.instructions,
        item.sortOrder,
      ],
    );
  }

  const scheduleWithExercises = await attachExercises(result.rows);

  return res.status(201).json({
    message: "Workout schedule created.",
    schedule: scheduleWithExercises[0],
  });
}

export async function updateSchedule(req, res) {
  const { id } = req.params;
  const {
    dayOfWeek,
    title,
    category,
    startTime,
    endTime,
    notes,
    exercises = [],
  } = req.body;

  const normalizedExercises = normalizeExerciseItems(exercises);
  if (!normalizedExercises.length) {
    return res.status(400).json({ message: "Add at least one exercise." });
  }

  const result = await query(
    `UPDATE exercise_schedules
     SET day_of_week = $1,
         title = $2,
         category = $3,
         start_time = $4,
         end_time = $5,
         notes = $6,
         updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [
      dayOfWeek,
      title,
      category || null,
      startTime || null,
      endTime || null,
      notes || null,
      id,
      req.user.id,
    ],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: "Schedule not found." });
  }

  await query("DELETE FROM exercise_schedule_items WHERE schedule_id = $1", [
    id,
  ]);

  for (const item of normalizedExercises) {
    await query(
      `INSERT INTO exercise_schedule_items (
        schedule_id, exercise_name, sets, reps, weight, rest_seconds, instructions, sort_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        item.exerciseName,
        item.sets,
        item.reps,
        item.weight,
        item.restSeconds,
        item.instructions,
        item.sortOrder,
      ],
    );
  }

  const scheduleWithExercises = await attachExercises(result.rows);

  return res.json({
    message: "Workout schedule updated.",
    schedule: scheduleWithExercises[0],
  });
}

export async function deleteSchedule(req, res) {
  const { id } = req.params;
  const result = await query(
    "DELETE FROM exercise_schedules WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, req.user.id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: "Schedule not found." });
  }

  return res.json({ message: "Workout schedule deleted." });
}

export async function getMyDocuments(req, res) {
  const result = await query(
    `SELECT id, client_id, document_name, document_type, file_path, file_size, created_at
     FROM client_documents
     WHERE client_id = $1 AND is_deleted = FALSE
     ORDER BY created_at DESC`,
    [req.user.id],
  );

  return res.json({ documents: result.rows });
}

export async function deleteMyDocument(req, res) {
  const { documentId } = req.params;

  // Verify the document belongs to the current user
  const docResult = await query(
    "SELECT id FROM client_documents WHERE id = $1 AND client_id = $2 AND is_deleted = FALSE",
    [documentId, req.user.id],
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
