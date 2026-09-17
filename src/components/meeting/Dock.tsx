import { useMeeting } from "@/lib/meeting/store";
import type { MicApp } from "@/lib/meeting/types";

const APPS: { name: string; fill: string; mic?: MicApp }[] = [
  { name: "Finder", fill: "#c5cdd8" },
  { name: "Safari", fill: "#8ea0b8" },
  { name: "Messages", fill: "#7fa98c" },
  { name: "Music", fill: "#c96b63" },
  { name: "Zoom", fill: "#6d8fb5", mic: "Zoom" },
  { name: "Slack", fill: "#b57d7d", mic: "Slack" },
  { name: "Teams", fill: "#6d7fb0", mic: "Teams" },
  { name: "Calendar", fill: "#c4a574" },
];

export function Dock() {
  const simulateMic = useMeeting((s) => s.simulateMic);
  const micApps = useMeeting((s) => s.micApps);
  const focusWindow = useMeeting((s) => s.focusWindow);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex justify-center px-3 sm:bottom-3">
      <div className="mac-blur pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-2xl px-2 py-1.5 shadow-popover">
        {APPS.map((app) => {
          const active = app.mic ? micApps.includes(app.mic) : false;
          return (
            <button
              key={app.name}
              type="button"
              title={
                app.mic
                  ? active
                    ? `${app.name} is using the microphone`
                    : `Simulate ${app.name} using the microphone`
                  : app.name === "Calendar"
                    ? "Open notes"
                    : app.name
              }
              onClick={() => {
                if (app.mic) simulateMic(active ? null : app.mic);
                else if (app.name === "Calendar") focusWindow("notes");
              }}
              className="flex w-12 flex-col items-center gap-1 sm:w-14"
            >
              <span
                className="grid size-10 place-items-center rounded-xl shadow-sm transition-transform duration-150 active:scale-[0.96] sm:size-12"
                style={{ background: app.fill }}
              >
                <span className="text-sm font-semibold text-ink">
                  {app.name.slice(0, 1)}
                </span>
              </span>
              <span
                className={`size-1 rounded-full ${active ? "bg-sage" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
