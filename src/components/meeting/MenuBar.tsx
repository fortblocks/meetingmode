import { formatHotkey } from "@/lib/meeting/hotkey";
import { formatClock } from "@/lib/utils";
import { useMeeting } from "@/lib/meeting/store";
import { MeetingIcon } from "./MeetingIcon";
import { StatusPopover } from "./StatusPopover";

export function MenuBar({ clock }: { clock: Date }) {
  const isOn = useMeeting((s) => s.isOn);
  const listening = useMeeting((s) => s.listening);
  const dndOn = useMeeting((s) => s.dndOn);
  const musicPaused = useMeeting((s) => s.musicPaused);
  const popoverOpen = useMeeting((s) => s.popoverOpen);
  const togglePopover = useMeeting((s) => s.togglePopover);
  const hotkey = useMeeting((s) => s.settings.hotkey);

  return (
    <header className="relative z-40 flex h-8 min-h-8 items-center justify-between px-3 text-menubar text-fg md:h-7">
      <div className="mac-blur pointer-events-none absolute inset-0 border-b border-line" />
      <nav className="relative flex min-w-0 items-center gap-3 font-medium">
        <span className="hidden sm:inline" aria-hidden="true">
          <AppleMark />
        </span>
        <span className="truncate font-semibold tracking-tight">
          {listening ? "Listening" : isOn ? "Meeting Mode" : "Finder"}
        </span>
        <span className="hidden text-muted sm:inline">File</span>
        <span className="hidden text-muted md:inline">Edit</span>
        <span className="hidden text-muted lg:inline">View</span>
      </nav>
      <div className="relative flex items-center gap-2.5">
        {musicPaused ? (
          <span className="hidden text-muted sm:inline" title="Music paused">
            Music paused
          </span>
        ) : null}
        {dndOn ? (
          <span className="text-muted" title="Focus / Do Not Disturb">
            <MoonMark />
          </span>
        ) : null}
        <div className="relative">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={popoverOpen}
            aria-label={`Meeting Mode, ${isOn ? "on" : "off"}. Shortcut ${formatHotkey(hotkey)}`}
            onClick={() => togglePopover()}
            className={`flex min-h-8 items-center gap-1.5 rounded-sm px-1.5 transition-colors duration-150 ${
              popoverOpen ? "bg-fg/10" : "hover:bg-fg/8"
            } ${listening ? "text-sage" : isOn ? "text-fg" : "text-fg/80"}`}
          >
            <MeetingIcon filled={isOn} listening={listening} />
            {listening ? (
              <span className="text-micro font-medium tracking-wide uppercase">
                Listening
              </span>
            ) : isOn ? (
              <span className="hidden text-micro font-medium tracking-wide uppercase sm:inline">
                On
              </span>
            ) : null}
          </button>
          {popoverOpen ? <StatusPopover /> : null}
        </div>
        <time
          className="min-w-28 text-right tabular-nums text-fg/90"
          dateTime={clock.toISOString()}
        >
          {formatClock(clock)}
        </time>
      </div>
    </header>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 14 16" className="size-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.4 8.3c0-2 1.6-2.9 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.4 0-2.6.8-3.3 2-.1.2-2.2 6.1.9 9.1.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.7.7 3 .7 2-1.1 2.7-2.2c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.3-3.5zM9.4 2.6c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.6 2.7-1.4z"
      />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.2.4a7.5 7.5 0 1 0 9 9.4A6.2 6.2 0 0 1 6.2.4z"
      />
    </svg>
  );
}
