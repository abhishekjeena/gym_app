import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

export function ProfileModal({ user, open, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user?.full_name || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    age: user?.age || "",
    membershipPlan: user?.membership_plan || "Monthly",
    emergencyContact: user?.emergency_contact || "",
    address: user?.address || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    setForm({
      fullName: user?.full_name || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      age: user?.age || "",
      membershipPlan: user?.membership_plan || "Monthly",
      emergencyContact: user?.emergency_contact || "",
      address: user?.address || "",
    });
    setProfileImage(null);
  }, [user, open]);

  if (!open || !user) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const data = await api.put("/user/profile", formData);
      onSaved(data.user);
      toast.success("Profile updated successfully.");
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card profile-modal">
        <button className="modal-close" type="button" onClick={onClose}>
          x
        </button>
        <h3>Edit Profile</h3>
        {error ? <p className="form-error">{error}</p> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
            placeholder="Full name"
            required
          />
          <div className="grid-two">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              placeholder="Phone"
            />
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((current) => ({ ...current, age: e.target.value }))}
              placeholder="Age"
            />
          </div>
          <div className="grid-two">
            <input
              type="text"
              value={form.gender}
              onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}
              placeholder="Gender"
            />
            <select
              value={form.membershipPlan}
              onChange={(e) =>
                setForm((current) => ({ ...current, membershipPlan: e.target.value }))
              }
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <input
            type="text"
            value={form.emergencyContact}
            onChange={(e) =>
              setForm((current) => ({ ...current, emergencyContact: e.target.value }))
            }
            placeholder="Emergency contact"
          />
          <textarea
            value={form.address}
            onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
            placeholder="Address"
            rows="3"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
          />
          <button type="submit" className="primary-button">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
