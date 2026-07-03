"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-actions">
      <Link href="/" className="btn-ghost admin-action-btn">
        Back to machine
      </Link>
      <button
        type="button"
        className="btn-primary admin-action-btn"
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
