import { CheckSquare, ExternalLink, FileText, Mic, MicOff, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { formatHotkey } from "@/lib/meeting/hotkey";
import { isPro } from "@/lib/meeting/pro";
import {
  selectActiveEvent,
  selectCurrentNote,
  selectElapsedMs,
  selectOpenActionCount,
  selectSessionTitle,
  useMeeting,
} from "@/lib/meeting/store";
import { MEETING_TEMPLATES } from "@/lib/meeting/templates";
import { upcomingEvents } from "@/lib/meeting/calendar";
import {
  formatElapsed,
  formatRange,
  formatRelative,
  remainingLabel,
} from "@/lib/utils";
import { CaptureBox } from "./CaptureBox";
import { MacSwitch } from "./MacSwitch";
import { MeetingIcon } from "./MeetingIcon";

export function StatusPopover() {
  const isOn = useMeeting((s) => s.isOn);
  const listening = useMeeting((s) => s.listening);
  const audioUploading = useMeeting((s) => s.audioUploading);
  const usingDemoAudio = useMeeting((s) => s.usingDemoAudio);
  const settings = useMeeting((s) => s.settings);
  const clock = useMeeting((s) => s.clock);
  const event = useMeeting(selectActiveEvent);
  const events = useMeeting((s) => s.events);
  const note = useMeeting(selectCurrentNote);
  const listenHint = useMeeting((s) => s.listenHint);
  const elapsed = useMeeting(selectElapsedMs);
  const captures = useMeeting((s) => s.captures);
  const title = useMeeting(selectSessionTitle);
  const openCount = useMeeting(selectOpenActionCount);
  const agenda = useMeeting((s) => s.agendaItems);
  const toggleMode = useMeeting((s) => s.toggleMode);
  const startMode = useMeeting((s) => s.startMode);
  const requestListen = useMeeting((s) => s.requestListen);
  const stopListen = useMeeting((s) => s.stopListen);
  const openJoin = useMeeting((s) => s.openJoin);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const togglePopover = useMeeting((s) => s.togglePopover);
  const setActiveEvent = useMeeting((s) => s.setActiveEvent);
  const requestWrapUp = useMeeting((s) => s.requestWrapUp);
  const wrapBusy = useMeeting((s) => s.wrapUpBusy);

  const pro = isPro(settings);
  const upcoming = upcomingEvents(events, clock);
  const joinLabel = event?.conferenceLabel
    ? `Join ${event.conferenceLabel}`
    : null;
  const showJoin = Boolean(
    event?.conferenceUrl && (!isOn || event.title === title),
  );

  return (
    <div
      role="dialog"
      aria-label="Meeting Mode"
      className="mac-blur absolute top-8 right-0 z-50 w-80 origin-top-right rounded-xl p-2 shadow-popover sm:top-7"
    >
      <div className="stagger-in max-h-[min(78vh,620px)] space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={isOn ? "text-sage" : "text-muted"}>
              <MeetingIcon filled={isOn} listening={listening} />
            </span>
            <div className="min-w-0">
              <p className="text-ui font-semibold tracking-tight">Meeting Mode</p>
              <p className="text-micro text-muted">
                {isOn
                  ? `${formatElapsed(elapsed)}${
                      event && event.title === title
                        ? ` · ${remainingLabel(event.end, clock)}`
                        : ""
                    }`
                  : formatHotkey(settings.hotkey)}
              </p>
            </div>
          </div>
          <MacSwitch
            checked={isOn}
            onChange={() => toggleMode()}
            label="Meeting Mode"
          />
        </div>

        {isOn ? (
          <div className="rounded-lg bg-elevated/80 px-3 py-2.5">
            <p className="text-micro font-medium tracking-wide text-muted uppercase">
              This meeting
            </p>
            <p className="mt-0.5 truncate text-ui font-semibold">{title}</p>
            {event && event.title === title ? (
              <p className="text-micro text-muted">
                {formatRange(event.start, event.end)} ·{" "}
                {formatRelative(event.start, clock)}
              </p>
            ) : (
              <p className="text-micro text-muted">Ad-hoc</p>
            )}
            {agenda.length ? (
              <p className="mt-1 text-micro text-subtle">
                Agenda {agenda.filter((a) => a.done).length}/{agenda.length}
                {openCount ? ` · ${openCount} open actions` : ""}
              </p>
            ) : null}
            {showJoin ? (
              <button
                type="button"
                onClick={openJoin}
                className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-silver px-3 text-sm font-semibold text-silver-fg transition-transform duration-150 active:scale-[0.96]"
              >
                {joinLabel}
                <ExternalLink className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : event ? (
          <div className="rounded-lg bg-elevated/80 px-3 py-2.5">
            <p className="text-micro font-medium tracking-wide text-muted uppercase">
              Next
            </p>
            <p className="mt-0.5 truncate text-ui font-semibold">{event.title}</p>
            <p className="text-micro text-muted">
              {formatRange(event.start, event.end)} · {formatRelative(event.start, clock)}
            </p>
            {event.attendees?.length ? (
              <p className="mt-1 truncate text-micro text-subtle">
                {event.attendees.join(" · ")}
              </p>
            ) : null}
            {joinLabel && event.conferenceUrl ? (
              <button
                type="button"
                onClick={openJoin}
                className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-silver px-3 text-sm font-semibold text-silver-fg transition-transform duration-150 active:scale-[0.96]"
              >
                {joinLabel}
                <ExternalLink className="size-3.5" />
              </button>
            ) : (
              <p className="mt-2 text-micro text-subtle">No conference link</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-elevated/80 px-3 py-2.5 text-sm text-muted">
            <p>No upcoming events</p>
            <p className="mt-1 text-micro text-subtle">
              Link Google Calendar in Settings, or start a 1:1 below.
            </p>
            <button
              type="button"
              onClick={() => {
                focusWindow("settings");
                togglePopover(false);
              }}
              className="mt-2 min-h-10 rounded-md bg-silver px-3 text-sm font-semibold text-silver-fg"
            >
              Link Google Calendar
            </button>
          </div>
        )}

        {!isOn ? (
          <div className="px-1 py-1">
            <p className="px-2 pb-1 text-micro font-medium tracking-wide text-muted uppercase">
              Start now
            </p>
            <div className="grid grid-cols-2 gap-1">
              {MEETING_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => startMode("toggle", undefined, t.id)}
                  className="rounded-md bg-elevated/80 px-2 py-2 text-left hover:bg-fg/8"
                >
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="text-micro text-subtle">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!isOn && upcoming.length > 1 ? (
          <div className="px-1 py-1">
            <p className="px-2 pb-1 text-micro font-medium tracking-wide text-muted uppercase">
              Today
            </p>
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setActiveEvent(ev.id)}
                className={`flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left ${
                  ev.id === event?.id ? "bg-fg/8" : "hover:bg-fg/6"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{ev.title}</span>
                  <span className="text-micro text-subtle">
                    {formatRange(ev.start, ev.end)}
                    {ev.conferenceLabel ? ` · ${ev.conferenceLabel}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-micro tabular-nums text-muted">
                  {formatRelative(ev.start, clock)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {isOn ? (
          <div className="rounded-lg bg-elevated/80 px-3 py-2.5">
            <p className="mb-2 text-micro font-medium tracking-wide text-muted uppercase">
              Capture
            </p>
            <CaptureBox compact />
          </div>
        ) : null}

        {isOn && note ? (
          <p className="px-2 text-micro text-muted">
            Note · ~/Meeting Mode/{note.filename}
            {captures.length ? ` · ${captures.length} lines` : ""}
          </p>
        ) : null}

        {listenHint ? (
          <p className="px-2 text-micro text-warn">{listenHint}</p>
        ) : null}

        <div className="flex flex-col pt-1">
          {listening ? (
            <PopoverRow
              icon={
                audioUploading ? (
                  <Mic className="size-4 text-sage" />
                ) : (
                  <MicOff className="size-4" />
                )
              }
              label="Stop listening"
              hint={
                usingDemoAudio
                  ? "Ends sample audio upload"
                  : "Ends microphone upload"
              }
              onClick={stopListen}
            />
          ) : (
            <PopoverRow
              icon={<Mic className="size-4" />}
              label="Start listening"
              hint={pro ? settings.listenMode : "Trial / Pro"}
              onClick={requestListen}
            />
          )}
          <PopoverRow
            icon={<FileText className="size-4" />}
            label="Open briefing"
            hint={isOn ? title : event?.title}
            onClick={() => {
              focusWindow("briefing");
              togglePopover(false);
            }}
          />
          <PopoverRow
            icon={<CheckSquare className="size-4" />}
            label="Open actions"
            hint={openCount ? `${openCount} open` : "Inbox"}
            onClick={() => {
              focusWindow("actions");
              togglePopover(false);
            }}
          />
          <PopoverRow
            icon={<FileText className="size-4" />}
            label="Open note"
            hint={note ? note.filename : "Last file stays on disk"}
            onClick={() => {
              focusWindow("notes");
              togglePopover(false);
            }}
          />
          {isOn ? (
            <PopoverRow
              icon={<FileText className="size-4" />}
              label={wrapBusy ? "Wrapping…" : "Wrap up now"}
              hint="Keeps the ritual on"
              onClick={() => void requestWrapUp()}
            />
          ) : null}
          <PopoverRow
            icon={<Settings2 className="size-4" />}
            label="Settings"
            onClick={() => {
              focusWindow("settings");
              togglePopover(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PopoverRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2.5 rounded-md px-2 text-left transition-colors duration-150 hover:bg-fg/8"
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint ? (
        <span className="max-w-28 truncate text-micro text-subtle">{hint}</span>
      ) : null}
    </button>
  );
}
