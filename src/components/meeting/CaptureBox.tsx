import { useState } from "react";
import { CAPTURE_LABEL, type CaptureKind } from "@/lib/meeting/types";
import { useMeeting } from "@/lib/meeting/store";
import { cn } from "@/lib/utils";

const KINDS: CaptureKind[] = [
  "note",
  "action",
  "decision",
  "parked",
  "question",
];

export function CaptureBox({ compact = false }: { compact?: boolean }) {
  const kind = useMeeting((s) => s.captureKind);
  const setKind = useMeeting((s) => s.setCaptureKind);
  const capture = useMeeting((s) => s.capture);
  const captures = useMeeting((s) => s.captures);
  const [value, setValue] = useState("");

  const submit = () => {
    const item = capture(value, kind);
    if (item) setValue("");
  };

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex flex-wrap gap-1">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded-md px-2 py-1 text-micro font-medium",
              kind === k ? "bg-silver text-silver-fg" : "bg-elevated text-muted",
            )}
          >
            {CAPTURE_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            kind === "action"
              ? "Alex: send usage Friday  ·  /a /d /p /q"
              : "Capture a line. /a action  /d decision  /p park"
          }
          className="h-10 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm text-fg outline-none ring-silver focus:ring-1"
        />
        <button
          type="button"
          onClick={submit}
          className="h-10 shrink-0 rounded-md bg-silver px-3 text-sm font-semibold text-silver-fg"
        >
          Add
        </button>
      </div>
      {captures.length ? (
        <ul className="max-h-24 space-y-1 overflow-y-auto">
          {captures
            .slice(-4)
            .reverse()
            .map((c) => (
              <li key={c.id} className="truncate text-micro text-muted">
                <span className="font-medium text-fg/80">
                  {CAPTURE_LABEL[c.kind]}
                </span>
                {" · "}
                {c.owner ? `${c.owner}: ` : ""}
                {c.text}
                {c.due ? ` (${c.due})` : ""}
              </li>
            ))}
        </ul>
      ) : compact ? null : (
        <p className="text-micro text-subtle">
          Lines land in the dated note. Actions also go to the inbox.
        </p>
      )}
    </div>
  );
}
