import { ExternalLink, FileText, Mic, MicOff, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { formatHotkey } from "@/lib/meeting/hotkey";
import { isPro } from "@/lib/meeting/pro";
import { selectCurrentNote, selectNextEvent, useMeeting } from "@/lib/meeting/store";
import { formatRange, formatRelative } from "@/lib/utils";
import { MacSwitch } from "./MacSwitch";
import { MeetingIcon } from "./MeetingIcon";

export function StatusPopover() {
  const isOn = useMeeting((s) => s.isOn);
  const listening = useMeeting((s) => s.listening);
  const audioUploading = useMeeting((s) => s.audioUploading);
  const usingDemoAudio = useMeeting((s) => s.usingDemoAudio);
  const settings = useMeeting((s) => s.settings);
  const clock = useMeeting((s) => s.clock);
  const event = useMeeting(selectNextEvent);
  const note = useMeeting(selectCurrentNote);
  const listenHint = useMeeting((s) => s.listenHint);
  const toggleMode = useMeeting((s) => s.toggleMode);
  const requestListen = useMeeting((s) => s.requestListen);
  const stopListen = useMeeting((s) => s.stopListen);
  const openJoin = useMeeting((s) => s.openJoin);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const togglePopover = useMeeting((s) => s.togglePopover);

  const pro = isPro(settings);
  const joinLabel = event?.conferenceLabel
    ? `Join ${event.conferenceLabel}`
    : null;

  return (
    <div
      role="dialog"
      aria-label="Meeting Mode"
      className="mac-blur absolute top-8 right-0 z-50 w-80 origin-top-right rounded-xl p-2 shadow-popover sm:top-7"
    >
      <div className="stagger-in space-y-1">
        <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={isOn ? "text-sage" : "text-muted"}>
              <MeetingIcon filled={isOn} listening={listening} />
            </span>
            <div className="min-w-0">
              <p className="text-ui font-semibold tracking-tight">Meeting Mode</p>
              <p className="text-micro text-muted">
                {formatHotkey(settings.hotkey)}
              </p>
            </div>
          </div>
          <MacSwitch
            checked={isOn}
            onChange={() => toggleMode()}
            label="Meeting Mode"
          />
        </div>

        {event ? (
          <div className="rounded-lg bg-elevated/80 px-3 py-2.5">
            <p className="text-micro font-medium tracking-wide text-muted uppercase">
              {isOn ? "This meeting" : "Next"}
            </p>
            <p className="mt-0.5 truncate text-ui font-semibold">{event.title}</p>
            <p className="text-micro text-muted">
              {formatRange(event.start, event.end)} · {formatRelative(event.start, clock)}
            </p>
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
            No upcoming events
          </div>
        )}

        {isOn && note ? (
          <p className="px-2 text-micro text-muted">
            Note · ~/Meeting Mode/{note.filename}
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
            label="Open note"
            hint={note ? note.filename : "Last file stays on disk"}
            onClick={() => {
              focusWindow("notes");
              togglePopover(false);
            }}
          />
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
      {hint ? <span className="text-micro text-subtle">{hint}</span> : null}
    </button>
  );
}
