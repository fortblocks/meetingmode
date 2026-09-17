import type { Hotkey } from "./types";

export function formatHotkey(h: Hotkey) {
  const parts: string[] = [];
  if (h.ctrl) parts.push("Control");
  if (h.alt) parts.push("Option");
  if (h.shift) parts.push("Shift");
  if (h.meta) parts.push("Command");
  parts.push(h.key.length === 1 ? h.key.toUpperCase() : h.key);
  return parts.join("-");
}

export function eventMatchesHotkey(e: KeyboardEvent, h: Hotkey) {
  if (e.ctrlKey !== h.ctrl) return false;
  if (e.altKey !== h.alt) return false;
  if (e.shiftKey !== h.shift) return false;
  if (e.metaKey !== h.meta) return false;
  return e.key.toLowerCase() === h.key.toLowerCase();
}

export function hotkeyFromEvent(e: KeyboardEvent): Hotkey | null {
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null;
  return {
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
    key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
  };
}
