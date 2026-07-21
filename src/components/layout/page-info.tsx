/**
 * "Consentimiento informado ambiental digital": every page opens with a
 * collapsible block that states, literally, what the page contains and what
 * can be done on it.
 */
export function PageInfo({ children }: { children: React.ReactNode }) {
  return (
    <details
      open
      className="mx-auto mb-6 w-full max-w-6xl rounded-lg border border-border bg-surface px-4 py-3"
    >
      <summary className="min-h-11 cursor-pointer list-item py-1 text-sm font-bold text-indigo">
        ¿Qué hay en esta página?
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </details>
  );
}
