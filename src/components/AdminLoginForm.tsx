"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1 className="admin-title">Admin</h1>
        <p className="admin-subtitle">Enter password to continue.</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className="admin-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            disabled={loading}
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn-primary admin-submit" disabled={loading}>
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        <Link href="/" className="admin-back">
          Back to machine
        </Link>
      </div>
    </div>
  );
}
