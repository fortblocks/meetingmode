export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="16" cy="16" r="12.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="5.25" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <Mark className="size-[1.15em]" />
      <span className="text-[1.05em] font-semibold tracking-[-0.035em]">
        meeting mode
      </span>
    </span>
  );
}
