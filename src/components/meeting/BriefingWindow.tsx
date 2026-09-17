import { relatedActions, peopleCards } from "@/lib/meeting/actions";
import { eventById } from "@/lib/meeting/calendar";
import {
  selectActiveEvent,
  selectCurrentNote,
  selectLastRelated,
  selectSessionTitle,
  useMeeting,
} from "@/lib/meeting/store";
import { formatRange, formatRelative } from "@/lib/utils";
import { AgendaList } from "./AgendaList";
import { MacWindow } from "./MacWindow";

export function BriefingWindow({
  z,
  onClose,
  onFocus,
}: {
  z: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const nextEvent = useMeeting(selectActiveEvent);
  const last = useMeeting(selectLastRelated);
  const note = useMeeting(selectCurrentNote);
  const clock = useMeeting((s) => s.clock);
  const isOn = useMeeting((s) => s.isOn);
  const sessionTitle = useMeeting(selectSessionTitle);
  const activeEventId = useMeeting((s) => s.activeEventId);
  const events = useMeeting((s) => s.events);
  const event = isOn ? eventById(events, activeEventId) : nextEvent;
  const attendees = event?.attendees ?? [];
  const actions = useMeeting((s) => s.actions);
  const notes = useMeeting((s) => s.notes);
  const agendaItems = useMeeting((s) => s.agendaItems);
  const prep = useMeeting((s) => s.prep);
  const prepBusy = useMeeting((s) => s.prepBusy);
  const prepError = useMeeting((s) => s.prepError);
  const openJoin = useMeeting((s) => s.openJoin);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const requestPrep = useMeeting((s) => s.requestPrep);
  const toggleAction = useMeeting((s) => s.toggleAction);

  const people = peopleCards(attendees, notes, actions);
  const roomActions = relatedActions(actions, attendees, sessionTitle);

  return (
    <MacWindow
      title={`Briefing — ${sessionTitle}`}
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      paper
      widthClass="w-[min(94vw,560px)]"
      className="max-h-[min(62vh,520px)]"
    >
      <div className="space-y-5 px-5 py-4 text-sm">
        <div>
          <p className="text-micro font-semibold tracking-wide text-paper-muted uppercase">
            This meeting
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {sessionTitle}
          </h2>
          {event ? (
            <p className="mt-0.5 text-paper-muted">
              {formatRange(event.start, event.end)} ·{" "}
              {formatRelative(event.start, clock)}
            </p>
          ) : isOn ? (
            <p className="mt-0.5 text-paper-muted">Ad-hoc — no calendar block</p>
          ) : (
            <p className="mt-0.5 text-paper-muted">No upcoming event</p>
          )}
          {event?.conferenceUrl ? (
            <button
              type="button"
              onClick={openJoin}
              className="mt-3 min-h-10 rounded-md bg-paper-fg px-3 text-sm font-semibold text-paper"
            >
              Join {event.conferenceLabel ?? "call"}
            </button>
          ) : null}
        </div>

        {people.length ? (
          <div>
            <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase">
              Who
            </h3>
            <ul className="mt-1.5 space-y-2">
              {people.map((p) => (
                <li key={p.name} className="leading-snug">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-micro text-paper-muted">
                    {p.lastNoteTitle
                      ? `Last: ${p.lastNoteTitle}`
                      : "No prior note"}
                    {p.openActions.length
                      ? ` · ${p.openActions.length} open`
                      : ""}
                  </p>
                  {p.openActions.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-micro text-paper-muted">
                      — {a.text}
                      {a.due ? ` (${a.due})` : ""}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {agendaItems.length ? <AgendaList paper /> : null}

        {roomActions.length ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase">
                Open from last time
              </h3>
              <button
                type="button"
                onClick={() => focusWindow("actions")}
                className="text-micro font-medium text-paper-muted"
              >
                Inbox
              </button>
            </div>
            <ul className="space-y-1">
              {roomActions.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => toggleAction(a.id)}
                    className="flex w-full items-start gap-2 rounded-md py-1 text-left hover:bg-paper-fg/6"
                  >
                    <span className="mt-0.5 size-3.5 shrink-0 rounded-[3px] border border-paper-fg/30" />
                    <span>
                      {a.text}
                      <span className="block text-micro text-paper-muted">
                        {a.owner}
                        {a.due ? ` · ${a.due}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-micro font-semibold tracking-wide text-paper-muted uppercase">
              Prep
            </h3>
            <button
              type="button"
              disabled={prepBusy}
              onClick={() => void requestPrep()}
              className="min-h-9 rounded-md bg-paper-fg px-3 text-xs font-semibold text-paper disabled:opacity-50"
            >
              {prepBusy ? "Prepping…" : prep ? "Prep again" : "Prep me"}
            </button>
          </div>
          {prepError ? (
            <p className="mt-2 text-micro text-danger">{prepError}</p>
          ) : null}
          {prep ? (
            <div className="mt-2 space-y-3">
              {prep.source === "offline" ? (
                <p className="text-micro text-paper-muted">
                  Offline prep{prep.error ? ` — ${prep.error}` : ""}.
                </p>
              ) : null}
              {prep.talkingPoints.length ? (
                <PrepList title="Talking points" items={prep.talkingPoints} />
              ) : null}
              {prep.remember.length ? (
                <PrepList title="Remember" items={prep.remember} />
              ) : null}
              {prep.questions.length ? (
                <PrepList title="Ask" items={prep.questions} />
              ) : null}
            </div>
          ) : last ? (
            <p className="mt-2 whitespace-pre-wrap text-paper-muted">
              {(last.summaryContent ?? last.content)
                .split("\n")
                .filter((l) => l.trim() && !l.startsWith("#"))
                .slice(0, 6)
                .join("\n")}
            </p>
          ) : (
            <p className="mt-2 text-paper-muted">
              Prep pulls last notes and open actions. Optional — capture still
              works without it.
            </p>
          )}
        </div>

        {note && isOn ? (
          <p className="text-micro text-paper-muted">
            Note is open at ~/Meeting Mode/{note.filename}. Capture from the
            bar at the bottom of the desktop.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => focusWindow("notes")}
            className="min-h-10 rounded-md bg-paper-fg/10 px-3 text-sm font-medium"
          >
            Open the note
          </button>
          <button
            type="button"
            onClick={() => focusWindow("actions")}
            className="min-h-10 rounded-md bg-paper-fg/10 px-3 text-sm font-medium"
          >
            Open actions
          </button>
        </div>
      </div>
    </MacWindow>
  );
}

function PrepList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-micro font-semibold tracking-wide text-paper-muted uppercase">
        {title}
      </h4>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
