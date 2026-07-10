import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e2e2e2",
        }}
      >
        <Link to="/" style={{ fontWeight: 600, color: "#1a1a1a", textDecoration: "none" }}>
          Compliance Traceability Platform
        </Link>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem", color: "#555" }}>
            <span>
              {user.email} <span style={{ color: "#999" }}>({user.role})</span>
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              style={{ padding: "0.3rem 0.7rem", cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        )}
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
