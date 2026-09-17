import {
  useMeeting,
  selectActiveEvent,
  selectElapsedMs,
  selectSessionTitle,
} from "@/lib/meeting/store";
import { formatElapsed, remainingLabel } from "@/lib/utils";
import { AgendaList } from "./AgendaList";
import { CaptureBox } from "./CaptureBox";

export function SessionBar() {
  const isOn = useMeeting((s) => s.isOn);
  const listening = useMeeting((s) => s.listening);
  const clock = useMeeting((s) => s.clock);
  const captures = useMeeting((s) => s.captures);
  const event = useMeeting(selectActiveEvent);
  const title = useMeeting(selectSessionTitle);
  const elapsed = useMeeting(selectElapsedMs);
  const requestWrapUp = useMeeting((s) => s.requestWrapUp);
  const wrapBusy = useMeeting((s) => s.wrapUpBusy);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const toggleMode = useMeeting((s) => s.toggleMode);
  const agenda = useMeeting((s) => s.agendaItems);
  const timeNotice = useMeeting((s) => s.timeNotice);
  const nextAgenda = agenda.find((a) => !a.done);

  if (!isOn) return null;

  const remaining =
    event && event.title === title ? remainingLabel(event.end, clock) : null;
  const warn = timeNotice?.kind === "five" || timeNotice?.kind === "over";

  return (
    <div className="absolute inset-x-0 bottom-[4.75rem] z-40 flex justify-center px-3 sm:bottom-24">
      <div
        className={`mac-blur w-[min(100%,42rem)] rounded-2xl p-3 shadow-window ${
          warn ? "ring-1 ring-warn/70" : ""
        }`}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {title}
            </p>
            <p
              className={`text-micro tabular-nums ${warn ? "text-warn" : "text-muted"}`}
            >
              {formatElapsed(elapsed)}
              {remaining ? ` · ${remaining}` : ""}
              {listening ? " · Listening" : ""}
              {captures.length
                ? ` · ${captures.length} capture${captures.length === 1 ? "" : "s"}`
                : ""}
              {agenda.length
                ? ` · ${agenda.filter((a) => a.done).length}/${agenda.length} agenda`
                : ""}
            </p>
            {nextAgenda ? (
              <p className="mt-0.5 truncate text-micro text-subtle">
                Next: {nextAgenda.text}
              </p>
            ) : agenda.length ? (
              <p className="mt-0.5 text-micro text-sage">Agenda clear</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => focusWindow("briefing")}
              className="h-9 rounded-md bg-elevated px-3 text-xs font-medium"
            >
              Briefing
            </button>
            <button
              type="button"
              onClick={() => focusWindow("notes")}
              className="h-9 rounded-md bg-elevated px-3 text-xs font-medium"
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => focusWindow("actions")}
              className="h-9 rounded-md bg-elevated px-3 text-xs font-medium"
            >
              Inbox
            </button>
            <button
              type="button"
              disabled={wrapBusy}
              onClick={() => void requestWrapUp()}
              className="h-9 rounded-md bg-silver px-3 text-xs font-semibold text-silver-fg disabled:opacity-50"
            >
              {wrapBusy ? "Wrapping…" : "Wrap up"}
            </button>
            <button
              type="button"
              onClick={() => void toggleMode()}
              className="h-9 rounded-md px-3 text-xs font-medium text-muted"
            >
              End
            </button>
          </div>
        </div>
        {agenda.length ? (
          <div className="mb-2 max-h-28 overflow-y-auto rounded-md bg-ink/25 px-2 py-1.5">
            <AgendaList compact />
          </div>
        ) : null}
        <CaptureBox compact />
      </div>
    </div>
  );
}
