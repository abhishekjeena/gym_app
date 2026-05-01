import { useState } from "react";
import { api } from "../api/client";

export function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await api.post("/auth/change-password", form);
      setMessage(data.message);
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Security</span>
          <h3>Change Password</h3>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      <form className="auth-form inline-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(e) =>
            setForm((current) => ({ ...current, currentPassword: e.target.value }))
          }
          required
        />
        <input
          type="password"
          placeholder="New strong password"
          value={form.newPassword}
          onChange={(e) =>
            setForm((current) => ({ ...current, newPassword: e.target.value }))
          }
          required
        />
        <button type="submit" className="secondary-button">
          Update Password
        </button>
      </form>
    </div>
  );
}

