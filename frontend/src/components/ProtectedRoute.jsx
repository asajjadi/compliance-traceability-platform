import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
