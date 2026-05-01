import { useEffect, useState } from "react";
import { DashboardShell } from "../layouts/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { ProfileModal } from "../components/ProfileModal";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { YourPlanModal } from "../components/YourPlanModal";

const planDurations = {
  Monthly: 1,
  Quarterly: 3,
  "Half-Yearly": 6,
  Yearly: 12,
};

function createExerciseRow() {
  return {
    id: crypto.randomUUID(),
    exerciseName: "",
    sets: "",
    reps: "",
    weight: "",
    restSeconds: "",
    instructions: "",
  };
}

function createScheduleForm() {
  return {
    dayOfWeek: "Monday",
    title: "",
    category: "",
    startTime: "",
    endTime: "",
    notes: "",
    exercises: [createExerciseRow()],
  };
}

function formatMembershipDate(value) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function calculateFinishDate(joinDate, planName) {
  if (!joinDate) return null;

  const monthsToAdd = planDurations[planName] || 1;
  const startDate = new Date(joinDate);
  const finishDate = new Date(startDate);
  finishDate.setMonth(finishDate.getMonth() + monthsToAdd);
  finishDate.setDate(finishDate.getDate() - 1);
  return finishDate;
}

function getDaysUntilMembershipEnds(finishDate) {
  if (!finishDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const finalDate = new Date(finishDate);
  finalDate.setHours(0, 0, 0, 0);

  return Math.floor((finalDate - today) / (1000 * 60 * 60 * 24));
}

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => index + 1);
}

export function ClientDashboard() {
  const schedulesPerPage = 10;
  const { user, setUser, refreshUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(createScheduleForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [renewalPopupOpen, setRenewalPopupOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "" });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [timelineMessage, setTimelineMessage] = useState("");
  const [schedulePage, setSchedulePage] = useState(1);
  const membershipPlan = user?.membership_plan || "Monthly";
  const membershipStartDate = user?.join_date;
  const membershipFinishDate = calculateFinishDate(
    membershipStartDate,
    membershipPlan,
  );
  const membershipFinishDateLabel = membershipFinishDate
    ?.toISOString()
    .slice(0, 10);
  const membershipDaysLeft = getDaysUntilMembershipEnds(membershipFinishDate);
  const membershipTickerItems = [
    `Plan Type: ${membershipPlan}`,
    `Membership Start: ${formatMembershipDate(membershipStartDate)}`,
    `Membership Finish: ${formatMembershipDate(membershipFinishDate)}`,
  ];
  const totalSchedulePages = Math.max(
    1,
    Math.ceil(schedules.length / schedulesPerPage),
  );
  const paginatedSchedules = schedules.slice(
    (schedulePage - 1) * schedulesPerPage,
    schedulePage * schedulesPerPage,
  );

  async function loadSchedules() {
    try {
      const [data, timelineData] = await Promise.all([
        api.get("/user/schedules"),
        api.get("/feedback/timeline"),
      ]);
      setSchedules(data.schedules);
      setTimelineMessage(timelineData.timeline?.content || "");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    setSchedulePage((current) => Math.min(current, totalSchedulePages));
  }, [totalSchedulePages]);

  useEffect(() => {
    if (!user?.id || !membershipFinishDateLabel || membershipDaysLeft === null)
      return;

    if (membershipDaysLeft > 10) {
      setRenewalPopupOpen(false);
      return;
    }

    const reminderKey = `membership-renewal-popup:${user.id}:${membershipFinishDateLabel}`;
    const shownCount = Number(window.localStorage.getItem(reminderKey) || "0");

    if (shownCount < 4) {
      setRenewalPopupOpen(true);
    }
  }, [membershipDaysLeft, membershipFinishDateLabel, user?.id]);

  async function handleProfileSaved(updatedUser) {
    setUser(updatedUser);
    await refreshUser();
  }

  function handleRenewalPopupClose() {
    if (user?.id && membershipFinishDateLabel) {
      const reminderKey = `membership-renewal-popup:${user.id}:${membershipFinishDateLabel}`;
      const shownCount = Number(
        window.localStorage.getItem(reminderKey) || "0",
      );
      window.localStorage.setItem(
        reminderKey,
        String(Math.min(shownCount + 1, 4)),
      );
    }

    setRenewalPopupOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/user/schedules/${editingId}`, form);
      } else {
        await api.post("/user/schedules", form);
      }
      setForm(createScheduleForm());
      setEditingId(null);
      loadSchedules();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/user/schedules/${id}`);
      loadSchedules();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      dayOfWeek: item.day_of_week,
      title: item.title,
      category: item.category || "",
      startTime: item.start_time || "",
      endTime: item.end_time || "",
      notes: item.notes || "",
      exercises:
        item.exercises?.length > 0
          ? item.exercises.map((exercise) => ({
              id: exercise.id || crypto.randomUUID(),
              exerciseName: exercise.exercise_name || "",
              sets: exercise.sets || "",
              reps: exercise.reps || "",
              weight: exercise.weight || "",
              restSeconds: exercise.rest_seconds || "",
              instructions: exercise.instructions || "",
            }))
          : [createExerciseRow()],
    });
  }

  function updateExercise(index, key, value) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [key]: value } : exercise,
      ),
    }));
  }

  function addExerciseRow() {
    setForm((current) => ({
      ...current,
      exercises: [...current.exercises, createExerciseRow()],
    }));
  }

  function removeExerciseRow(index) {
    setForm((current) => ({
      ...current,
      exercises:
        current.exercises.length === 1
          ? current.exercises
          : current.exercises.filter(
              (_, exerciseIndex) => exerciseIndex !== index,
            ),
    }));
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();
    setFeedbackError("");
    setFeedbackMessage("");

    try {
      const data = await api.post("/feedback", feedbackForm);
      setFeedbackMessage(data.message);
      setFeedbackForm({ rating: 5, comment: "" });
    } catch (err) {
      setFeedbackError(err.message);
    }
  }

  return (
    <>
      <DashboardShell
        title="Client Fitness Hub"
        subtitle="Update your profile, protect your account, and manage your weekly exercise plan."
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => setProfileOpen(true)}
          >
            Open Profile
          </button>
        }
        sidebarContent={
          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-link"
              onClick={() => setPlanModalOpen(true)}
            >
              📋 Your Plan
            </button>
          </div>
        }
      >
        {timelineMessage ? (
          <section
            className="site-timeline-banner"
            aria-label="Gym timeline news"
          >
            <div className="site-timeline-track">
              {[0, 1].map((copy) => (
                <div className="site-timeline-group" key={copy}>
                  <span className="site-timeline-pill">Latest Update</span>
                  <strong>{timelineMessage}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="membership-ticker" aria-label="Membership details">
          <div className="membership-ticker-track">
            {[0, 1].map((copy) => (
              <div className="membership-ticker-group" key={copy}>
                {membershipTickerItems.map((item) => (
                  <div className="membership-chip" key={`${copy}-${item}`}>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="stats-grid">
          <div className="dashboard-card profile-card">
            <span className="eyebrow">Member Profile</span>
            <div className="profile-head">
              <img
                src={
                  user?.profile_image_url
                    ? `http://localhost:5000${user.profile_image_url}`
                    : "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=300&q=80"
                }
                alt={user?.full_name}
              />
              <div>
                <h3>{user?.full_name}</h3>
                <p>{user?.email}</p>
                <p>{user?.membership_plan || "Monthly"} plan</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <span className="eyebrow">Privacy</span>
            <h3>Consent Stored</h3>
            <p>
              Your account includes privacy consent tracking and secure cookie
              sessions.
            </p>
          </div>

          <div className="dashboard-card">
            <span className="eyebrow">Feedback</span>
            <h3>Share Your Gym Experience</h3>
            <p>
              Your rating and message will appear on the landing page feedback
              popup.
            </p>
            {feedbackError ? (
              <p className="form-error">{feedbackError}</p>
            ) : null}
            {feedbackMessage ? (
              <p className="form-success">{feedbackMessage}</p>
            ) : null}
            <form
              className="auth-form feedback-form"
              onSubmit={handleFeedbackSubmit}
            >
              <div
                className="feedback-stars-input"
                aria-label="Choose a star rating"
              >
                {renderStars().map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    className={`feedback-star-button ${
                      starValue <= feedbackForm.rating ? "active" : ""
                    }`}
                    onClick={() =>
                      setFeedbackForm((current) => ({
                        ...current,
                        rating: starValue,
                      }))
                    }
                    aria-label={`${starValue} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows="4"
                placeholder="Write your feedback"
                value={feedbackForm.comment}
                onChange={(event) =>
                  setFeedbackForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                required
              />
              <button type="submit" className="primary-button">
                Submit Feedback
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {editingId ? "Update" : "Create"}
                </span>
                <h3>Day-wise Exercise Schedule</h3>
              </div>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="grid-two">
                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      dayOfWeek: e.target.value,
                    }))
                  }
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Workout title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid-two">
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid-two">
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      endTime: e.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Short note"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="exercise-builder">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Exercises</span>
                    <h3>Multiple Exercise Rows</h3>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={addExerciseRow}
                  >
                    Add Exercise
                  </button>
                </div>
                {form.exercises.map((exercise, index) => (
                  <div className="exercise-row-card" key={exercise.id}>
                    <div className="section-heading">
                      <strong>Exercise {index + 1}</strong>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => removeExerciseRow(index)}
                        disabled={form.exercises.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid-two">
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={exercise.exerciseName}
                        onChange={(e) =>
                          updateExercise(index, "exerciseName", e.target.value)
                        }
                        required={index === 0}
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Sets"
                        value={exercise.sets}
                        onChange={(e) =>
                          updateExercise(index, "sets", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid-two">
                      <input
                        type="text"
                        placeholder="Reps, e.g. 10-12"
                        value={exercise.reps}
                        onChange={(e) =>
                          updateExercise(index, "reps", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Weight, e.g. 20 kg"
                        value={exercise.weight}
                        onChange={(e) =>
                          updateExercise(index, "weight", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid-two">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rest seconds"
                        value={exercise.restSeconds}
                        onChange={(e) =>
                          updateExercise(index, "restSeconds", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Instructions, e.g. slow negative"
                        value={exercise.instructions}
                        onChange={(e) =>
                          updateExercise(index, "instructions", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="primary-button">
                {editingId ? "Update Schedule" : "Add Schedule"}
              </button>
            </form>
          </div>

          <div className="dashboard-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Weekly Plan</span>
                <h3>Your Exercise Listing</h3>
              </div>
            </div>
            <div className="schedule-list">
              {paginatedSchedules.map((item) => (
                <article className="schedule-item" key={item.id}>
                  <div>
                    <strong>{item.day_of_week}</strong>
                    <h4>{item.title}</h4>
                    <p>
                      {item.category || "General"} | {item.start_time || "--"}{" "}
                      to {item.end_time || "--"}
                    </p>
                    <div className="exercise-listing">
                      {item.exercises?.map((exercise, index) => (
                        <div
                          className="exercise-list-item"
                          key={exercise.id || index}
                        >
                          <strong>{exercise.exercise_name}</strong>
                          <p>
                            {exercise.sets
                              ? `${exercise.sets} sets`
                              : "Sets: --"}{" "}
                            |{" "}
                            {exercise.reps
                              ? `${exercise.reps} reps`
                              : "Reps: --"}{" "}
                            |{" "}
                            {exercise.weight
                              ? `Weight: ${exercise.weight}`
                              : "Weight: --"}{" "}
                            |{" "}
                            {exercise.rest_seconds
                              ? `Rest: ${exercise.rest_seconds}s`
                              : "Rest: --"}
                          </p>
                          {exercise.instructions ? (
                            <span>{exercise.instructions}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {item.notes ? <span>{item.notes}</span> : null}
                  </div>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {schedules.length > schedulesPerPage ? (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setSchedulePage((current) => Math.max(1, current - 1))
                  }
                  disabled={schedulePage === 1}
                >
                  Previous
                </button>
                <span className="pagination-label">
                  Page {schedulePage} of {totalSchedulePages}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setSchedulePage((current) =>
                      Math.min(totalSchedulePages, current + 1),
                    )
                  }
                  disabled={schedulePage === totalSchedulePages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <ChangePasswordCard />
      </DashboardShell>

      <ProfileModal
        user={user}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={handleProfileSaved}
      />

      {renewalPopupOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card renewal-modal">
            <h3>
              {membershipDaysLeft < 0
                ? "Membership Ended"
                : "Membership Renewal Alert"}
            </h3>
            <p>
              {membershipDaysLeft < 0
                ? `Your ${membershipPlan.toLowerCase()} plan ended on ${formatMembershipDate(
                    membershipFinishDate,
                  )}. Please take a new subscription to keep your membership active.`
                : `Your ${membershipPlan.toLowerCase()} plan will end on ${formatMembershipDate(
                    membershipFinishDate,
                  )}. Please take a new subscription soon.`}
            </p>
            <div className="renewal-meta">
              <div className="renewal-pill">Plan: {membershipPlan}</div>
              <div className="renewal-pill">
                {membershipDaysLeft < 0
                  ? `Expired ${Math.abs(membershipDaysLeft)} day(s) ago`
                  : `${membershipDaysLeft} day(s) left`}
              </div>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={handleRenewalPopupClose}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <YourPlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
      />
    </>
  );
}
