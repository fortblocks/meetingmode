import type { ActionItem, NoteFile } from "./types";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function matchAttendee(token: string, attendees: string[]) {
  const t = token.toLowerCase();
  return (
    attendees.find((a) => {
      const lower = a.toLowerCase();
      const first = lower.split(/\s+/)[0];
      return lower === t || first === t || lower.startsWith(t);
    }) ?? ""
  );
}

export function resolveDue(token: string, now = new Date()): string {
  const t = token.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (t === "today" || t === "eod") return isoDate(d);
  if (t === "tomorrow") {
    d.setDate(d.getDate() + 1);
    return isoDate(d);
  }
  const idx = WEEKDAYS.indexOf(t);
  if (idx >= 0) {
    const delta = (idx - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + delta);
    return isoDate(d);
  }
  return "";
}

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseOwnerDue(
  text: string,
  attendees: string[] = [],
): { text: string; owner: string; due: string } {
  let rest = text.trim();
  let owner = "";
  let due = "";

  const at = rest.match(/^@([A-Za-z][\w.-]*)\s+(.+)$/);
  if (at) {
    owner = matchAttendee(at[1], attendees) || at[1];
    rest = at[2];
  } else {
    const colon = rest.match(/^([A-Z][a-zA-Z.-]{1,24}):\s+(.+)$/);
    if (colon) {
      owner = matchAttendee(colon[1], attendees) || colon[1];
      rest = colon[2];
    }
  }

  const dueMatch = rest.match(
    /\s+(?:by\s+|due\s+)?(today|tomorrow|eod|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})$/i,
  );
  if (dueMatch && dueMatch.index !== undefined) {
    due = resolveDue(dueMatch[1]);
    rest = rest.slice(0, dueMatch.index).trim();
  }

  return { text: rest, owner, due };
}

export function formatActionLine(input: {
  text: string;
  owner?: string;
  due?: string;
}) {
  let s = input.text;
  if (input.owner && !s.toLowerCase().startsWith(`${input.owner.toLowerCase()}:`)) {
    s = `${input.owner}: ${s}`;
  }
  if (input.due) s += ` (due ${input.due})`;
  return s;
}

export function actionKey(item: { owner: string; text: string }) {
  return `${item.owner.trim().toLowerCase()}::${item.text.trim().toLowerCase()}`;
}

export function mergeActions(existing: ActionItem[], incoming: ActionItem[]) {
  const seen = new Set(existing.map(actionKey));
  const next = [...existing];
  for (const item of incoming) {
    const key = actionKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    next.unshift(item);
  }
  return next;
}

export function relatedActions(
  actions: ActionItem[],
  attendees: string[],
  title?: string,
) {
  const names = attendees.map((a) => a.toLowerCase().split(/\s+/)[0]);
  const titleWords = (title ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  return actions.filter((a) => {
    if (a.done) return false;
    const ownerFirst = a.owner.toLowerCase().split(/\s+/)[0];
    if (names.includes(ownerFirst) || names.includes(a.owner.toLowerCase())) {
      return true;
    }
    if (titleWords.length && titleWords.some((w) => a.meetingTitle.toLowerCase().includes(w))) {
      return true;
    }
    return false;
  });
}

export type PersonCard = {
  name: string;
  lastNoteTitle?: string;
  lastNoteWhen?: string;
  openActions: ActionItem[];
};

export function peopleCards(
  attendees: string[],
  notes: NoteFile[],
  actions: ActionItem[],
): PersonCard[] {
  return attendees.map((name) => {
    const first = name.toLowerCase().split(/\s+/)[0];
    const last = notes.find((n) => n.title.toLowerCase().includes(first));
    const openActions = actions.filter(
      (a) =>
        !a.done &&
        a.owner.toLowerCase().split(/\s+/)[0] === first,
    );
    return {
      name,
      lastNoteTitle: last?.title,
      lastNoteWhen: last?.createdAt,
      openActions,
    };
  });
}

export function seedOpenActions(now = new Date()): ActionItem[] {
  const today = isoDate(now);
  const friday = resolveDue("friday", now);
  return [
    {
      id: "act-alex-usage",
      text: "Send Acme usage export",
      owner: "Alex",
      due: today,
      done: false,
      createdAt: now.toISOString(),
      meetingTitle: "Q3 pipeline review",
      noteId: "hist-pipeline",
      source: "seed",
    },
    {
      id: "act-priya-dpa",
      text: "DPA redlines",
      owner: "Priya",
      due: friday,
      done: false,
      createdAt: now.toISOString(),
      meetingTitle: "Q3 pipeline review",
      noteId: "hist-pipeline",
      source: "seed",
    },
    {
      id: "act-you-acme",
      text: "Take the Thursday Acme call with Maya",
      owner: "You",
      due: "",
      done: false,
      createdAt: now.toISOString(),
      meetingTitle: "1:1 with Maya",
      noteId: "hist-maya",
      source: "seed",
    },
  ];
}
