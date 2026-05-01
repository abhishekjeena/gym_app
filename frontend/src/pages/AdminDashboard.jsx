import { useEffect, useState } from "react";
import { DashboardShell } from "../layouts/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { ProfileModal } from "../components/ProfileModal";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { ClientDocumentsModal } from "../components/ClientDocumentsModal";

const planDurations = {
  Monthly: 1,
  Quarterly: 3,
  "Half-Yearly": 6,
  Yearly: 12,
};

const emptyClient = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
  age: "",
  membershipPlan: "Monthly",
  joinDate: new Date().toISOString().slice(0, 10),
  address: "",
};

const initialRenewalForm = {
  membershipPlan: "Monthly",
  joinDate: new Date().toISOString().slice(0, 10),
};

function calculateFinishDate(joinDate, planName) {
  if (!joinDate) return null;

  const monthsToAdd = planDurations[planName] || 1;
  const startDate = new Date(joinDate);
  const finishDate = new Date(startDate);
  finishDate.setMonth(finishDate.getMonth() + monthsToAdd);
  finishDate.setDate(finishDate.getDate() - 1);
  return finishDate;
}

export function AdminDashboard() {
  const clientsPerPage = 10;
  const planListPerPage = 10;
  const { user, setUser, refreshUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalClients: 0, totalSchedules: 0 });
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyClient);
  const [editingId, setEditingId] = useState(null);
  const [planListOpen, setPlanListOpen] = useState(false);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalForm, setRenewalForm] = useState(initialRenewalForm);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineForm, setTimelineForm] = useState({ content: "" });
  const [timelineStatus, setTimelineStatus] = useState("");
  const [error, setError] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [planListPage, setPlanListPage] = useState(1);

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
      new Date(value),
    );
  }

  function getDaysUntilPlanEnds(finishDate) {
    if (!finishDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const finalDate = new Date(finishDate);
    finalDate.setHours(0, 0, 0, 0);

    return Math.floor((finalDate - today) / (1000 * 60 * 60 * 24));
  }

  async function loadData() {
    try {
      const [statsRes, clientsRes, timelineRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/clients"),
        api.get("/admin/timeline"),
      ]);
      setStats(statsRes.stats);
      setClients(clientsRes.clients);
      setTimelineForm({ content: timelineRes.timeline?.content || "" });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleProfileSaved(updatedUser) {
    setUser(updatedUser);
    await refreshUser();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = { ...form, age: Number(form.age) || null };
      if (editingId) {
        await api.put(`/admin/clients/${editingId}`, payload);
      } else {
        await api.post("/admin/clients", payload);
      }
      setForm(emptyClient);
      setEditingId(null);
      setClientFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/clients/${id}`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleActivate(id) {
    try {
      await api.patch(`/admin/clients/${id}/activate`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(client) {
    setSelectedClient(null);
    setEditingId(client.id);
    setForm({
      fullName: client.full_name,
      email: client.email,
      password: "",
      phone: client.phone || "",
      gender: client.gender || "",
      age: client.age || "",
      membershipPlan: client.membership_plan || "Monthly",
      joinDate: client.join_date || "",
      address: client.address || "",
    });
    setClientFormOpen(true);
  }

  function startCreate() {
    setSelectedClient(null);
    setEditingId(null);
    setForm(emptyClient);
    setError("");
    setClientFormOpen(true);
  }

  function openRenewal(client) {
    const currentPlanEndDate = calculateFinishDate(
      client.join_date || client.created_at,
      client.membership_plan,
    );
    const nextJoinDate = currentPlanEndDate
      ? new Date(currentPlanEndDate)
      : new Date();
    nextJoinDate.setDate(nextJoinDate.getDate() + 1);

    setSelectedClient(client);
    setRenewalForm({
      membershipPlan: client.membership_plan || "Monthly",
      joinDate: nextJoinDate.toISOString().slice(0, 10),
    });
    setRenewalOpen(true);
  }

  async function handleRenewalSubmit(event) {
    event.preventDefault();
    if (!selectedClient) return;

    setError("");
    try {
      const payload = {
        fullName: selectedClient.full_name,
        phone: selectedClient.phone || "",
        gender: selectedClient.gender || "",
        age: selectedClient.age || null,
        membershipPlan: renewalForm.membershipPlan,
        joinDate: renewalForm.joinDate,
        address: selectedClient.address || "",
      };

      const data = await api.put(
        `/admin/clients/${selectedClient.id}`,
        payload,
      );
      setSelectedClient(data.client);
      setRenewalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTimelineSubmit(event) {
    event.preventDefault();
    setError("");
    setTimelineStatus("");

    try {
      const data = await api.post("/admin/timeline", timelineForm);
      setTimelineForm({ content: data.timeline?.content || "" });
      setTimelineStatus(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  const planListClients = clients
    .map((client) => {
      const joinDate = client.join_date || client.created_at;
      const planEndDate = calculateFinishDate(joinDate, client.membership_plan);
      const daysLeft = getDaysUntilPlanEnds(planEndDate);

      if (daysLeft === null || daysLeft > 10) {
        return null;
      }

      return {
        ...client,
        daysLeft,
        planEndDate,
        planStatus: daysLeft < 0 ? "expired" : "near-expiry",
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.planStatus !== right.planStatus) {
        return left.planStatus === "expired" ? -1 : 1;
      }

      return left.daysLeft - right.daysLeft;
    });

  useEffect(() => {
    const totalClientPages = Math.max(
      1,
      Math.ceil(clients.length / clientsPerPage),
    );
    setClientPage((current) => Math.min(current, totalClientPages));
  }, [clients.length]);

  useEffect(() => {
    const totalPlanPages = Math.max(
      1,
      Math.ceil(planListClients.length / planListPerPage),
    );
    setPlanListPage((current) => Math.min(current, totalPlanPages));
  }, [planListClients.length]);

  const totalClientPages = Math.max(
    1,
    Math.ceil(clients.length / clientsPerPage),
  );
  const paginatedClients = clients.slice(
    (clientPage - 1) * clientsPerPage,
    clientPage * clientsPerPage,
  );
  const totalPlanPages = Math.max(
    1,
    Math.ceil(planListClients.length / planListPerPage),
  );
  const paginatedPlanListClients = planListClients.slice(
    (planListPage - 1) * planListPerPage,
    planListPage * planListPerPage,
  );

  const editPlanEndDate = calculateFinishDate(
    form.joinDate,
    form.membershipPlan,
  );

  return (
    <>
      <DashboardShell
        title="Admin Command Center"
        subtitle="Manage members, track activity, and control gym operations from one place."
        sidebarContent={
          <div className="sidebar-tools">
            <button
              type="button"
              className="sidebar-action-button"
              onClick={() => setTimelineOpen(true)}
            >
              <strong>Timeline</strong>
              <span>Update the running top news message</span>
            </button>
          </div>
        }
        actions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={startCreate}
            >
              Add Client
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setPlanListPage(1);
                setPlanListOpen(true);
              }}
            >
              Plan Listing ({planListClients.length})
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setProfileOpen(true)}
            >
              Open Profile
            </button>
          </>
        }
      >
        <section className="stats-grid">
          <div className="dashboard-card profile-card">
            <span className="eyebrow">Admin Profile</span>
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
                <p>{user?.phone || "Phone not added yet"}</p>
                <p>{user?.membership_plan || "Monthly"} plan</p>
              </div>
            </div>
            <p>
              {user?.address ||
                "Add your address and other personal details from your profile."}
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setProfileOpen(true)}
            >
              Edit My Profile
            </button>
          </div>
          <div className="dashboard-card">
            <span className="eyebrow">Clients</span>
            <h2>{stats.totalClients}</h2>
            <p>Registered members</p>
          </div>
          <div className="dashboard-card">
            <span className="eyebrow">Schedules</span>
            <h2>{stats.totalSchedules}</h2>
            <p>Workout plans created</p>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Listing</span>
                <h3>Client Directory</h3>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client) => (
                    <tr key={client.id}>
                      <td data-label="Name">{client.full_name}</td>
                      <td data-label="Email">{client.email}</td>
                      <td data-label="Plan">{client.membership_plan}</td>
                      <td data-label="Phone">{client.phone || "-"}</td>
                      <td data-label="Status">
                        <span
                          className={`client-status-badge ${
                            client.is_active === false ? "inactive" : "active"
                          }`}
                        >
                          {client.is_active === false ? "Deactive" : "Active"}
                        </span>
                      </td>
                      <td className="table-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setSelectedClient(client)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => startEdit(client)}
                        >
                          Edit
                        </button>
                        {client.is_active === false ? (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => handleActivate(client.id)}
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => handleDelete(client.id)}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {clients.length > clientsPerPage ? (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setClientPage((current) => Math.max(1, current - 1))
                  }
                  disabled={clientPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-label">
                  Page {clientPage} of {totalClientPages}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setClientPage((current) =>
                      Math.min(totalClientPages, current + 1),
                    )
                  }
                  disabled={clientPage === totalClientPages}
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

      {clientFormOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card renewal-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                setClientFormOpen(false);
                setEditingId(null);
                setForm(emptyClient);
              }}
            >
              x
            </button>
            <span className="eyebrow">Client</span>
            <h3>{editingId ? "Edit Client" : "Add Client"}</h3>
            {error ? <p className="form-error">{error}</p> : null}
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    fullName: e.target.value,
                  }))
                }
                required
              />
              <div className="grid-two">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  required
                  disabled={Boolean(editingId)}
                />
                {!editingId ? (
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Password managed separately"
                    disabled
                  />
                )}
              </div>
              <div className="grid-two">
                <input
                  type="text"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      phone: e.target.value,
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={form.age}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, age: e.target.value }))
                  }
                />
              </div>
              <div className="grid-two">
                <input
                  type="text"
                  placeholder="Gender"
                  value={form.gender}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      gender: e.target.value,
                    }))
                  }
                />
                <select
                  value={form.membershipPlan}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      membershipPlan: e.target.value,
                    }))
                  }
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="grid-two">
                <label className="field-stack">
                  <span>Joined On</span>
                  <input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        joinDate: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="field-stack">
                  <span>Plan Ends On</span>
                  <input
                    type="text"
                    value={editPlanEndDate ? formatDate(editPlanEndDate) : "-"}
                    readOnly
                    disabled
                  />
                </label>
              </div>
              <textarea
                rows="3"
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    address: e.target.value,
                  }))
                }
              />
              <button type="submit" className="primary-button">
                {editingId ? "Update Client" : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {renewalOpen && selectedClient ? (
        <div className="modal-backdrop">
          <div className="modal-card renewal-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setRenewalOpen(false)}
            >
              x
            </button>
            <h3>Renew Subscription</h3>
            <p>
              Update the renewed plan for{" "}
              <strong>{selectedClient.full_name}</strong>. The client dashboard
              running plan bar will show the new plan and expiry after refresh
              or next login.
            </p>
            <form className="auth-form" onSubmit={handleRenewalSubmit}>
              <select
                value={renewalForm.membershipPlan}
                onChange={(event) =>
                  setRenewalForm((current) => ({
                    ...current,
                    membershipPlan: event.target.value,
                  }))
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <input
                type="date"
                value={renewalForm.joinDate}
                onChange={(event) =>
                  setRenewalForm((current) => ({
                    ...current,
                    joinDate: event.target.value,
                  }))
                }
                required
              />
              <button type="submit" className="primary-button">
                Save Renewal
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {planListOpen ? (
        <div
          className="side-popup-backdrop"
          onClick={() => setPlanListOpen(false)}
        >
          <aside
            className="side-popup-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="side-popup-header">
              <div>
                <span className="eyebrow">Plan Listing</span>
                <h3>Expiry Alerts</h3>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setPlanListOpen(false)}
              >
                x
              </button>
            </div>

            <div className="side-popup-list">
              {planListClients.length ? (
                paginatedPlanListClients.map((client) => (
                  <button
                    type="button"
                    key={client.id}
                    className={`sidebar-plan-item ${client.planStatus}`}
                    onClick={() => {
                      setSelectedClient(client);
                      setPlanListOpen(false);
                    }}
                  >
                    <strong>{client.full_name}</strong>
                    <span>
                      {client.planStatus === "expired"
                        ? `Expired on ${formatDate(client.planEndDate)}`
                        : `Ending on ${formatDate(client.planEndDate)}`}
                    </span>
                  </button>
                ))
              ) : (
                <p className="sidebar-plan-empty">
                  No expired or near-expiry plans right now.
                </p>
              )}
            </div>
            {planListClients.length > planListPerPage ? (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPlanListPage((current) => Math.max(1, current - 1))
                  }
                  disabled={planListPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-label">
                  Page {planListPage} of {totalPlanPages}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setPlanListPage((current) =>
                      Math.min(totalPlanPages, current + 1),
                    )
                  }
                  disabled={planListPage === totalPlanPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {timelineOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card timeline-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setTimelineOpen(false)}
            >
              x
            </button>
            <span className="eyebrow">Timeline</span>
            <h3>Update Running News</h3>
            <p>
              This message will move from right to left on the landing page and
              client dashboard.
            </p>
            {error ? <p className="form-error">{error}</p> : null}
            {timelineStatus ? (
              <p className="form-success">{timelineStatus}</p>
            ) : null}
            <form className="auth-form" onSubmit={handleTimelineSubmit}>
              <textarea
                rows="5"
                placeholder="Write the message you want to show across the website"
                value={timelineForm.content}
                onChange={(event) =>
                  setTimelineForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                required
              />
              <button type="submit" className="primary-button">
                Save Timeline
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {selectedClient ? (
        <div className="modal-backdrop">
          <div className="modal-card client-view-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedClient(null)}
            >
              x
            </button>
            <div className="client-view-header">
              <img
                src={
                  selectedClient.profile_image_url
                    ? `http://localhost:5000${selectedClient.profile_image_url}`
                    : "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=300&q=80"
                }
                alt={selectedClient.full_name}
              />
              <div>
                <span className="eyebrow">Client Details</span>
                <h3>{selectedClient.full_name}</h3>
                <p>{selectedClient.email}</p>
                <p>{selectedClient.membership_plan || "Monthly"} plan</p>
              </div>
            </div>

            <div className="client-detail-grid">
              <div className="client-detail-item">
                <span>Phone</span>
                <strong>{selectedClient.phone || "-"}</strong>
              </div>
              <div className="client-detail-item">
                <span>Gender</span>
                <strong>{selectedClient.gender || "-"}</strong>
              </div>
              <div className="client-detail-item">
                <span>Age</span>
                <strong>{selectedClient.age || "-"}</strong>
              </div>
              <div className="client-detail-item">
                <span>Consent</span>
                <strong>
                  {selectedClient.gdpr_consent ? "Accepted" : "Pending"}
                </strong>
              </div>
              <div className="client-detail-item">
                <span>Joined On</span>
                <strong>
                  {formatDate(
                    selectedClient.join_date || selectedClient.created_at,
                  )}
                </strong>
              </div>
              <div className="client-detail-item">
                <span>Plan Ends On</span>
                <strong>
                  {formatDate(
                    calculateFinishDate(
                      selectedClient.join_date || selectedClient.created_at,
                      selectedClient.membership_plan,
                    ),
                  )}
                </strong>
              </div>
              <div className="client-detail-item">
                <span>Role</span>
                <strong>{selectedClient.role || "client"}</strong>
              </div>
            </div>

            <div className="client-detail-item client-detail-block">
              <span>Address</span>
              <strong>
                {selectedClient.address || "No address added yet."}
              </strong>
            </div>
            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => startEdit(selectedClient)}
              >
                Edit Client
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => openRenewal(selectedClient)}
              >
                Renew Subscription
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDocumentsModalOpen(true)}
              >
                Manage Plan File
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {documentsModalOpen && selectedClient && (
        <ClientDocumentsModal
          client={selectedClient}
          onClose={() => setDocumentsModalOpen(false)}
        />
      )}
    </>
  );
}
