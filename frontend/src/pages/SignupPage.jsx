import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { formStyles as s } from "./formStyles.js";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(organizationName, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.page}>
      <form onSubmit={handleSubmit} style={s.form}>
        <h1 style={s.heading}>Create your organization</h1>
        {error && <p style={s.error}>{error}</p>}
        <label style={s.label}>
          Organization name
          <input
            style={s.input}
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        </label>
        <label style={s.label}>
          Email
          <input style={s.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label style={s.label}>
          Password
          <input
            style={s.input}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button style={s.button} type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create organization"}
        </button>
        <p style={s.footNote}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
