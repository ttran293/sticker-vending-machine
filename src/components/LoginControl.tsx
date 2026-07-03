"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginControl() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { authenticated?: boolean }) => {
        if (active) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!checked) return null;

  return (
    <Link
      href={authenticated ? "/dashboard" : "/admin"}
      className="footer-link"
    >
      {authenticated ? "Dashboard" : "Log in"}
    </Link>
  );
}
