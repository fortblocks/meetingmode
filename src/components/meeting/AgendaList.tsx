import { useMeeting } from "@/lib/meeting/store";
import { cn } from "@/lib/utils";

export function AgendaList({
  paper = false,
  compact = false,
}: {
  paper?: boolean;
  compact?: boolean;
}) {
  const items = useMeeting((s) => s.agendaItems);
  const toggle = useMeeting((s) => s.toggleAgenda);
  if (!items.length) return null;
  const done = items.filter((i) => i.done).length;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p
          className={cn(
            "text-micro font-semibold tracking-wide uppercase",
            paper ? "text-paper-muted" : "text-muted",
          )}
        >
          Agenda
        </p>
        <p
          className={cn(
            "text-micro tabular-nums",
            paper ? "text-paper-muted" : "text-subtle",
          )}
        >
          {done}/{items.length}
        </p>
      </div>
      <ul className={cn("space-y-1", compact && "space-y-0.5")}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                "flex w-full min-h-9 items-start gap-2 rounded-md px-1.5 py-1 text-left text-sm",
                paper ? "hover:bg-paper-fg/6" : "hover:bg-fg/6",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border",
                  item.done
                    ? paper
                      ? "border-paper-fg bg-paper-fg text-paper"
                      : "border-sage bg-sage text-sage-fg"
                    : paper
                      ? "border-paper-fg/30"
                      : "border-line-strong",
                )}
                aria-hidden
              >
                {item.done ? (
                  <svg viewBox="0 0 12 12" className="size-3">
                    <path
                      d="M2.5 6.2 5 8.6 9.5 3.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  item.done && "text-muted line-through",
                )}
              >
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
