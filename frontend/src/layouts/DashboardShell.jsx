import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DashboardShell({ title, subtitle, actions, sidebarContent, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/" className="brand-mark">
          OLD SCHOOL FITNESS GYM
        </Link>
        <div className="sidebar-user">
          <div className="avatar-circle">
            {user?.full_name?.slice(0, 1)?.toUpperCase() || "G"}
          </div>
          <div>
            <strong>{user?.full_name}</strong>
            <p>{user?.role}</p>
          </div>
        </div>
        {sidebarContent}
        <button type="button" className="ghost-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="dashboard-actions">{actions}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
