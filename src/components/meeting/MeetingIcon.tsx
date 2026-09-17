import { cn } from "@/lib/utils";

export function MeetingIcon({
  filled,
  listening,
  className,
}: {
  filled: boolean;
  listening?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 18 18"
      className={cn("size-4", listening && "icon-pulse", className)}
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r="6.4"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="9"
        cy="9"
        r="2.2"
        fill={filled ? "var(--color-ink)" : "currentColor"}
        opacity={filled ? 0.9 : 0.55}
      />
    </svg>
  );
}
