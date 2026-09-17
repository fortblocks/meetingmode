import { useState } from "react";
import { useMeeting } from "@/lib/meeting/store";
import { MacWindow } from "./MacWindow";

export function WrapUpWindow({
  z,
  onClose,
  onFocus,
}: {
  z: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const wrapUp = useMeeting((s) => s.wrapUp);
  const busy = useMeeting((s) => s.wrapUpBusy);
  const error = useMeeting((s) => s.wrapUpError);
  const note = useMeeting((s) =>
    s.notes.find((n) => n.id === s.currentNoteId),
  );

  return (
    <MacWindow
      title="Wrap-up"
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      paper
      widthClass="w-[min(94vw,560px)]"
    >
      <div className="space-y-5 px-5 py-4 text-sm">
        {busy ? (
          <p className="text-paper-muted">Grok is writing the wrap-up…</p>
        ) : null}
        {error ? <p className="text-danger">{error}</p> : null}
        {wrapUp?.source === "offline" ? (
          <p className="rounded-md bg-paper-fg/6 px-3 py-2 text-paper-muted">
            Offline draft{wrapUp.error ? ` — ${wrapUp.error}` : ""}. Review
            before sending.
          </p>
        ) : null}
        {note?.summaryFilename ? (
          <p className="text-micro text-paper-muted">
            Saved ~/Meeting Mode/{note.summaryFilename}
          </p>
        ) : null}
        {wrapUp ? (
          <>
            <Block title="Summary" text={wrapUp.summary} />
            <List title="Decisions" items={wrapUp.decisions} />
            <div>
              <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase whitespace-nowrap">
                Actions
              </h3>
              <ul className="mt-1 space-y-1">
                {wrapUp.actions.map((a, i) => (
                  <li key={`${a.task}-${i}`}>
                    {a.task} — {a.owner}
                    {a.due ? ` (${a.due})` : ""}
                  </li>
                ))}
              </ul>
              <CopyButton
                label="Copy actions"
                text={wrapUp.actions
                  .map(
                    (a) =>
                      `- ${a.task} (${a.owner}${a.due ? `, ${a.due}` : ""})`,
                  )
                  .join("\n")}
              />
            </div>
            <List title="Open questions" items={wrapUp.open_questions} />
            <Block title="Follow-up email" text={wrapUp.followup_email} />
          </>
        ) : !busy ? (
          <p className="text-paper-muted">
            Stop Meeting Mode with wrap-up enabled, or use Process sample
            transcript in Settings.
          </p>
        ) : null}
      </div>
    </MacWindow>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase whitespace-nowrap">
        {title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{text}</p>
      <CopyButton label={`Copy ${title.toLowerCase()}`} text={text} />
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase whitespace-nowrap">
        {title}
      </h3>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={`${item}-${i}`}>{item}</li>
        ))}
      </ul>
      <CopyButton label={`Copy ${title.toLowerCase()}`} text={items.join("\n")} />
    </div>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      className="mt-2 min-h-10 rounded-md bg-paper-fg/8 px-3 text-xs font-semibold text-paper-fg"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
