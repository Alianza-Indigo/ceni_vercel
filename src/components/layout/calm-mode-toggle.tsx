"use client";

import * as React from "react";

const STORAGE_KEY = "ceni-calm";

/**
 * Persistent calm-mode switch. State lives in localStorage and on the user
 * profile when a session exists (synced via /api/profile/calm-mode).
 */
export function CalmModeToggle() {
  const [calm, setCalm] = React.useState(false);

  React.useEffect(() => {
    setCalm(document.documentElement.getAttribute("data-calm") === "true");
  }, []);

  function toggle() {
    const next = !calm;
    setCalm(next);
    if (next) {
      document.documentElement.setAttribute("data-calm", "true");
    } else {
      document.documentElement.removeAttribute("data-calm");
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage unavailable: the choice still applies to this page view.
    }
    void fetch("/api/profile/calm-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calmMode: next }),
    }).catch(() => {
      // Sin sesión no hay perfil que actualizar; el modo sigue activo localmente.
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={calm}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-indigo hover:bg-surface"
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12c3-5 6-5 9 0s6 5 9 0" />
      </svg>
      <span>{calm ? "Modo calma: activado" : "Modo calma"}</span>
    </button>
  );
}
