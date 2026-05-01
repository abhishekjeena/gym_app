import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ClientDashboard } from "./pages/ClientDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client"
        element={
          <ProtectedRoute role="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

