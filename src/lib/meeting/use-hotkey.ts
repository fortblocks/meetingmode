import { useEffect } from "react";
import { eventMatchesHotkey } from "./hotkey";
import { useMeeting } from "./store";

export function useMeetingHotkey() {
  const hotkey = useMeeting((s) => s.settings.hotkey);
  const toggleMode = useMeeting((s) => s.toggleMode);
  const hydrated = useMeeting((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable;
      if (typing && !(e.ctrlKey && e.altKey)) return;
      if (!eventMatchesHotkey(e, hotkey)) return;
      e.preventDefault();
      toggleMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hydrated, hotkey, toggleMode]);
}
