import type { ReactNode } from "react";
import { useMeeting } from "@/lib/meeting/store";
import { cn } from "@/lib/utils";

export function DesktopIcons() {
  const hidden = useMeeting((s) => s.isOn);
  const notes = useMeeting((s) => s.notes);
  const focusWindow = useMeeting((s) => s.focusWindow);

  return (
    <div
      className={cn(
        "absolute top-12 right-4 z-10 flex flex-col items-center gap-5 transition-[opacity,transform] duration-200 sm:right-8 sm:top-14",
        hidden && "icons-hide",
      )}
      aria-hidden={hidden}
    >
      <DesktopIcon label="Macintosh HD" onClick={() => {}}>
        <DriveGlyph />
      </DesktopIcon>
      <DesktopIcon
        label="Meeting Mode"
        onClick={() => focusWindow("notes")}
        badge={notes.length ? String(notes.length) : undefined}
      >
        <FolderGlyph />
      </DesktopIcon>
      <DesktopIcon label="Documents" onClick={() => focusWindow("notes")}>
        <DocsGlyph />
      </DesktopIcon>
    </div>
  );
}

function DesktopIcon({
  label,
  onClick,
  children,
  badge,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-20 flex-col items-center gap-1"
    >
      <span className="relative grid size-14 place-items-center drop-shadow-lg transition-transform duration-150 group-active:scale-[0.96]">
        {children}
        {badge ? (
          <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-silver px-1 text-micro font-semibold text-silver-fg">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="max-w-20 truncate rounded-sm bg-ink/45 px-1 text-center text-micro text-fg shadow-sm">
        {label}
      </span>
    </button>
  );
}

function FolderGlyph() {
  return (
    <svg viewBox="0 0 56 48" className="h-12 w-14">
      <path
        d="M4 12.5c0-2.5 1.8-4.5 4-4.5h12l4 4h24c2.2 0 4 2 4 4.5v23c0 2.5-1.8 4.5-4 4.5H8c-2.2 0-4-2-4-4.5v-27z"
        fill="#c5cdd8"
      />
      <path
        d="M4 20h48v19.5c0 2.5-1.8 4.5-4 4.5H8c-2.2 0-4-2-4-4.5V20z"
        fill="#9aa4b2"
      />
      <circle cx="40" cy="30" r="4" fill="#6d9b7c" />
    </svg>
  );
}

function DriveGlyph() {
  return (
    <svg viewBox="0 0 56 40" className="h-10 w-14">
      <rect x="4" y="8" width="48" height="24" rx="4" fill="#3a3b42" />
      <rect x="8" y="12" width="40" height="10" rx="2" fill="#26272d" />
      <circle cx="40" cy="27" r="2" fill="#6d9b7c" />
    </svg>
  );
}

function DocsGlyph() {
  return (
    <svg viewBox="0 0 44 52" className="h-12 w-10">
      <path
        d="M8 4h20l12 12v28c0 2-1.6 4-4 4H8c-2.4 0-4-2-4-4V8c0-2.2 1.8-4 4-4z"
        fill="#f4f0e6"
      />
      <path d="M28 4v10c0 1.2.8 2 2 2h10" fill="#e2dccf" />
      <path d="M12 24h20M12 30h16M12 36h18" stroke="#1c1a16" strokeWidth="1.6" opacity="0.35" />
    </svg>
  );
}
