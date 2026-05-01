import { query } from "../config/db.js";

function buildFeedbackSummary(feedback) {
  const totalFeedback = feedback.length;
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const item of feedback) {
    ratingBreakdown[item.rating] += 1;
  }

  const averageRating = totalFeedback
    ? Number(
        (
          feedback.reduce((total, item) => total + Number(item.rating || 0), 0) / totalFeedback
        ).toFixed(1)
      )
    : 0;

  return {
    averageRating,
    totalFeedback,
    ratingBreakdown,
  };
}

export async function getFeedback(req, res) {
  const result = await query(
    `SELECT
        client_feedback.id,
        client_feedback.rating,
        client_feedback.comment,
        client_feedback.created_at,
        users.full_name
     FROM client_feedback
     INNER JOIN users ON users.id = client_feedback.user_id
     ORDER BY client_feedback.created_at DESC`
  );

  return res.json({
    feedback: result.rows,
    summary: buildFeedbackSummary(result.rows),
  });
}

export async function createFeedback(req, res) {
  const rating = Number(req.body.rating);
  const comment = req.body.comment?.trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Please choose a star rating between 1 and 5." });
  }

  if (!comment || comment.length < 3) {
    return res.status(400).json({ message: "Please enter your feedback message." });
  }

  const result = await query(
    `INSERT INTO client_feedback (user_id, rating, comment)
     VALUES ($1, $2, $3)
     RETURNING id, rating, comment, created_at`,
    [req.user.id, rating, comment]
  );

  return res.status(201).json({
    message: "Feedback submitted successfully.",
    feedback: {
      ...result.rows[0],
      full_name: req.user.full_name,
    },
  });
}
