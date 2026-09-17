import { useState } from "react";
import { useMeeting } from "@/lib/meeting/store";
import { CAPTURE_LABEL } from "@/lib/meeting/types";
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
  const captures = useMeeting((s) => s.captures);
  const agenda = useMeeting((s) => s.agendaItems);
  const requestWrapUp = useMeeting((s) => s.requestWrapUp);
  const isOn = useMeeting((s) => s.isOn);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const note = useMeeting((s) =>
    s.notes.find((n) => n.id === s.currentNoteId),
  );
  const skipped = agenda.filter((a) => !a.done);
  const covered = agenda.filter((a) => a.done);

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

        {!wrapUp && !busy ? (
          <div className="space-y-3">
            <p className="text-paper-muted">
              {captures.length
                ? `${captures.length} capture${captures.length === 1 ? "" : "s"} ready. Wrap-up uses what you wrote, plus listening if it was on.`
                : "Capture actions, decisions, and notes during the call, then wrap up. Listening is optional."}
            </p>
            {agenda.length ? (
              <p className="text-micro text-paper-muted">
                Agenda {covered.length}/{agenda.length} checked
                {skipped.length
                  ? ` · skipped: ${skipped.map((s) => s.text).join(", ")}`
                  : ""}
              </p>
            ) : null}
            {captures.length ? (
              <ul className="space-y-1 text-paper-muted">
                {captures.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-paper-fg">
                      {CAPTURE_LABEL[c.kind]}
                    </span>
                    {" · "}
                    {c.owner ? `${c.owner}: ` : ""}
                    {c.text}
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void requestWrapUp()}
              className="min-h-10 rounded-md bg-paper-fg px-3 text-sm font-semibold text-paper"
            >
              Write wrap-up
            </button>
          </div>
        ) : null}

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
            <p className="text-micro text-paper-muted">
              Actions from this wrap-up are in the inbox.
            </p>
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
            <div className="flex flex-wrap gap-2 border-t border-paper-fg/10 pt-4">
              <CopyButton
                label="Copy whole wrap-up"
                text={[
                  wrapUp.summary,
                  "",
                  "Decisions",
                  ...wrapUp.decisions.map((d) => `- ${d}`),
                  "",
                  "Actions",
                  ...wrapUp.actions.map(
                    (a) =>
                      `- ${a.task} (${a.owner}${a.due ? `, ${a.due}` : ""})`,
                  ),
                ].join("\n")}
              />
              <button
                type="button"
                onClick={() => focusWindow("actions")}
                className="mt-2 min-h-10 rounded-md bg-paper-fg/8 px-3 text-xs font-semibold"
              >
                Open inbox
              </button>
              {isOn ? (
                <button
                  type="button"
                  onClick={() => void requestWrapUp()}
                  className="mt-2 min-h-10 rounded-md bg-paper-fg/8 px-3 text-xs font-semibold"
                >
                  Rewrite wrap-up
                </button>
              ) : null}
            </div>
          </>
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
