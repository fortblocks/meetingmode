import { useEffect, useState } from "react";
import { formatHotkey } from "@/lib/meeting/hotkey";
import { useMeeting } from "@/lib/meeting/store";
import { useMeetingHotkey } from "@/lib/meeting/use-hotkey";
import { useListening } from "@/lib/meeting/use-listening";
import { ActionsWindow } from "./ActionsWindow";
import { BriefingWindow } from "./BriefingWindow";
import { DesktopIcons } from "./DesktopIcons";
import { Dock } from "./Dock";
import { LiveCuesPanel } from "./LiveCuesPanel";
import { MenuBar } from "./MenuBar";
import { NotesWindow } from "./NotesWindow";
import { NotificationStack } from "./NotificationStack";
import { ConsentSheet, TrialSheet } from "./Sheets";
import { SessionBar } from "./SessionBar";
import { SettingsWindow } from "./SettingsWindow";
import { WrapUpWindow } from "./WrapUpWindow";

const WINDOWS = [
  "settings",
  "notes",
  "wrapup",
  "briefing",
  "actions",
] as const;

export function MacDesktop() {
  const hydrate = useMeeting((s) => s.hydrate);
  const tick = useMeeting((s) => s.tick);
  const clock = useMeeting((s) => s.clock);
  const isOn = useMeeting((s) => s.isOn);
  const listening = useMeeting((s) => s.listening);
  const popoverOpen = useMeeting((s) => s.popoverOpen);
  const togglePopover = useMeeting((s) => s.togglePopover);
  const windowOrder = useMeeting((s) => s.windowOrder);
  const closeWindow = useMeeting((s) => s.closeWindow);
  const focusWindow = useMeeting((s) => s.focusWindow);
  const hotkey = useMeeting((s) => s.settings.hotkey);
  const [hint, setHint] = useState(true);

  useMeetingHotkey();
  useListening();

  useEffect(() => {
    hydrate();
    tick();
    const id = window.setInterval(() => useMeeting.getState().tick(), 1000);
    return () => window.clearInterval(id);
  }, [hydrate, tick]);

  useEffect(() => {
    if (isOn) setHint(false);
  }, [isOn]);

  const zFor = (name: (typeof WINDOWS)[number]) =>
    20 + windowOrder.indexOf(name);

  return (
    <div className="relative h-dvh overflow-hidden bg-ink text-fg">
      <img
        src="/wallpaper.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-ink/20" />

      <MenuBar clock={new Date(clock)} />

      <div
        className="absolute inset-0 z-0"
        onClick={() => {
          if (popoverOpen) togglePopover(false);
        }}
      />

      <DesktopIcons />
      <NotificationStack />
      <LiveCuesPanel />
      <SessionBar />

      {windowOrder.includes("settings") ? (
        <SettingsWindow
          z={zFor("settings")}
          onClose={() => closeWindow("settings")}
          onFocus={() => focusWindow("settings")}
        />
      ) : null}

      {windowOrder.includes("notes") ? (
        <NotesWindow
          z={zFor("notes")}
          onClose={() => closeWindow("notes")}
          onFocus={() => focusWindow("notes")}
        />
      ) : null}

      {windowOrder.includes("wrapup") ? (
        <WrapUpWindow
          z={zFor("wrapup")}
          onClose={() => closeWindow("wrapup")}
          onFocus={() => focusWindow("wrapup")}
        />
      ) : null}

      {windowOrder.includes("briefing") ? (
        <BriefingWindow
          z={zFor("briefing")}
          onClose={() => closeWindow("briefing")}
          onFocus={() => focusWindow("briefing")}
        />
      ) : null}

      {windowOrder.includes("actions") ? (
        <ActionsWindow
          z={zFor("actions")}
          onClose={() => closeWindow("actions")}
          onFocus={() => focusWindow("actions")}
        />
      ) : null}

      {hint && !isOn ? (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-4">
          <p className="rounded-full bg-ink/55 px-3 py-1.5 text-center text-sm text-fg/90">
            Click the menu extra or press {formatHotkey(hotkey)} — start the
            next call, a 1:1, or standup
          </p>
        </div>
      ) : null}

      {isOn ? (
        <p className="pointer-events-none absolute bottom-[7.5rem] left-1/2 z-20 hidden -translate-x-1/2 rounded-full bg-ink/50 px-3 py-1 text-micro text-muted sm:block">
          Desktop icons hidden · Focus on
          {listening ? " · Listening" : ""}
        </p>
      ) : null}

      <Dock />
      <ConsentSheet />
      <TrialSheet />
    </div>
  );
}
