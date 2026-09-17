import { useState } from "react";
import { useMeeting } from "@/lib/meeting/store";
import { MacWindow } from "./MacWindow";

export function ActionsWindow({
  z,
  onClose,
  onFocus,
}: {
  z: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const actions = useMeeting((s) => s.actions);
  const toggle = useMeeting((s) => s.toggleAction);
  const add = useMeeting((s) => s.addManualAction);
  const [draft, setDraft] = useState("");
  const [showDone, setShowDone] = useState(false);
  const open = actions.filter((a) => !a.done);
  const done = actions.filter((a) => a.done);
  const list = showDone ? done : open;

  return (
    <MacWindow
      title="Open actions"
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      paper
      widthClass="w-[min(94vw,520px)]"
    >
      <div className="space-y-4 px-5 py-4 text-sm">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDone(false)}
            className={`min-h-9 rounded-md px-3 text-xs font-medium ${
              !showDone ? "bg-paper-fg text-paper" : "bg-paper-fg/8"
            }`}
          >
            Open · {open.length}
          </button>
          <button
            type="button"
            onClick={() => setShowDone(true)}
            className={`min-h-9 rounded-md px-3 text-xs font-medium ${
              showDone ? "bg-paper-fg text-paper" : "bg-paper-fg/8"
            }`}
          >
            Done · {done.length}
          </button>
        </div>

        {!showDone ? (
          <div className="flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(draft);
                  setDraft("");
                }
              }}
              placeholder="Alex: send usage Friday"
              className="h-10 min-w-0 flex-1 rounded-md bg-paper-fg/6 px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                add(draft);
                setDraft("");
              }}
              className="h-10 rounded-md bg-paper-fg px-3 text-sm font-semibold text-paper"
            >
              Add
            </button>
          </div>
        ) : null}

        {list.length === 0 ? (
          <p className="text-paper-muted">
            {showDone
              ? "Nothing completed yet."
              : "Inbox is clear. Captures with /a land here, and wrap-up adds the rest."}
          </p>
        ) : (
          <ul className="space-y-1">
            {list.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left hover:bg-paper-fg/6"
                >
                  <span
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border ${
                      a.done
                        ? "border-paper-fg bg-paper-fg text-paper"
                        : "border-paper-fg/30"
                    }`}
                  >
                    {a.done ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={a.done ? "line-through text-paper-muted" : ""}>
                      {a.text}
                    </span>
                    <span className="mt-0.5 block text-micro text-paper-muted">
                      {a.owner}
                      {a.due ? ` · due ${a.due}` : ""}
                      {a.meetingTitle ? ` · ${a.meetingTitle}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MacWindow>
  );
}
