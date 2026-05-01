import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="screen-loader">Loading your gym portal...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/client"} replace />;
  }

  return children;
}

