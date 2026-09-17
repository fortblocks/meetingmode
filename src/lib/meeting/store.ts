import { create } from "zustand";
import {
  formatActionLine,
  mergeActions,
  relatedActions,
  seedOpenActions,
  uid,
} from "./actions";
import {
  buildDemoEvents,
  eventById,
  eventStartingSoon,
  nextEvent,
  upcomingEvents,
} from "./calendar";
import {
  CAPTURE_HEADING,
  capturesAsTranscript,
  insertUnderHeading,
  parseCaptureInput,
} from "./capture";
import { SAMPLE_NOTES, SAMPLE_TRANSCRIPT, seedHistoryNotes } from "./fixtures";
import { prepMeeting, wrapUpMeeting } from "./grok";
import { buildNoteMarkdown, buildSummaryMarkdown } from "./markdown";
import { isPro } from "./pro";
import { templateById, type MeetingTemplateId } from "./templates";
import {
  DEFAULT_SETTINGS,
  FAIR_USE_MS,
  type ActionItem,
  type AgendaItem,
  type CalendarEvent,
  type Capture,
  type CaptureKind,
  type Hotkey,
  type LiveCues,
  type MicApp,
  type NoteFile,
  type OfferNotification,
  type PrepResult,
  type Settings,
  type TimeNotice,
  type WrapUpResult,
} from "./types";
import { monthKey, noteFilename } from "../utils";

const SETTINGS_KEY = "meeting-mode:settings";
const NOTES_KEY = "meeting-mode:notes";
const USAGE_KEY = "meeting-mode:usage";
const ACTIONS_KEY = "meeting-mode:actions";

type Usage = { month: string; streamedMs: number };

export type WindowName =
  | "settings"
  | "notes"
  | "wrapup"
  | "briefing"
  | "actions";

export type MeetingStore = {
  hydrated: boolean;
  settings: Settings;
  notes: NoteFile[];
  events: CalendarEvent[];
  usage: Usage;
  isOn: boolean;
  dndOn: boolean;
  musicPaused: boolean;
  listening: boolean;
  listenStartedAt: number | null;
  audioUploading: boolean;
  micActive: boolean;
  usingDemoAudio: boolean;
  fairUseStopped: boolean;
  popoverOpen: boolean;
  consentOpen: boolean;
  trialOpen: boolean;
  activeWindow: WindowName | null;
  windowOrder: WindowName[];
  currentNoteId: string | null;
  wrapUp: WrapUpResult | null;
  wrapUpBusy: boolean;
  wrapUpError: string | null;
  cues: LiveCues | null;
  cuesError: string | null;
  transcript: string;
  outline: string[];
  recordingChunks: Blob[];
  offer: OfferNotification | null;
  micApps: MicApp[];
  clock: number;
  listenHint: string | null;
  sessionStartedAt: number | null;
  sessionTitle: string | null;
  activeEventId: string | null;
  captures: Capture[];
  captureKind: CaptureKind;
  actions: ActionItem[];
  agendaItems: AgendaItem[];
  prep: PrepResult | null;
  prepBusy: boolean;
  prepError: string | null;
  timeNotice: TimeNotice | null;

  hydrate: () => void;
  tick: () => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setHotkey: (hotkey: Hotkey) => void;
  togglePopover: (open?: boolean) => void;
  setActiveWindow: (name: WindowName | null) => void;
  closeWindow: (name: WindowName) => void;
  focusWindow: (name: WindowName) => void;
  toggleMode: () => void;
  startMode: (
    source?: "hotkey" | "toggle" | "offer",
    eventId?: string,
    templateId?: MeetingTemplateId,
  ) => void;
  stopMode: () => Promise<void>;
  requestListen: () => void;
  confirmListen: () => void;
  declineListen: () => void;
  stopListen: () => void;
  startTrial: () => void;
  dismissTrial: () => void;
  openJoin: () => void;
  updateCurrentNote: (content: string) => void;
  processSampleTranscript: () => Promise<void>;
  simulateMic: (app: MicApp | null) => void;
  dismissOffer: () => void;
  acceptOffer: () => void;
  setCues: (cues: LiveCues | null, error?: string | null) => void;
  appendTranscript: (line: string) => void;
  setMicActive: (v: boolean) => void;
  setAudioUploading: (v: boolean) => void;
  addRecordingChunk: (blob: Blob) => void;
  addStreamedMs: (ms: number) => void;
  setListenHint: (msg: string | null) => void;
  setUsingDemoAudio: (v: boolean) => void;
  setActiveEvent: (id: string) => void;
  setCaptureKind: (kind: CaptureKind) => void;
  capture: (raw: string, kind?: CaptureKind) => Capture | null;
  requestWrapUp: () => Promise<void>;
  toggleAgenda: (id: string) => void;
  toggleAction: (id: string) => void;
  addManualAction: (raw: string) => void;
  requestPrep: () => Promise<void>;
  dismissTimeNotice: () => void;
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function persistSettings(settings: Settings) {
  saveJson(SETTINGS_KEY, settings);
}

function persistNotes(notes: NoteFile[]) {
  saveJson(NOTES_KEY, notes);
}

function persistUsage(usage: Usage) {
  saveJson(USAGE_KEY, usage);
}

function persistActions(actions: ActionItem[]) {
  saveJson(ACTIONS_KEY, actions);
}

function relatedNote(notes: NoteFile[], title: string, skipId?: string | null) {
  const words = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  if (!words.length) return null;
  return (
    notes.find(
      (n) =>
        n.id !== skipId &&
        words.some((w) => n.title.toLowerCase().includes(w)),
    ) ?? null
  );
}

export const useMeeting = create<MeetingStore>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  notes: [],
  events: buildDemoEvents(new Date()),
  usage: { month: monthKey(), streamedMs: 0 },
  isOn: false,
  dndOn: false,
  musicPaused: false,
  listening: false,
  listenStartedAt: null,
  audioUploading: false,
  micActive: false,
  usingDemoAudio: false,
  fairUseStopped: false,
  popoverOpen: false,
  consentOpen: false,
  trialOpen: false,
  activeWindow: null,
  windowOrder: [],
  currentNoteId: null,
  wrapUp: null,
  wrapUpError: null,
  wrapUpBusy: false,
  cues: null,
  cuesError: null,
  transcript: "",
  outline: [],
  recordingChunks: [],
  offer: null,
  micApps: [],
  clock: Date.now(),
  listenHint: null,
  sessionStartedAt: null,
  sessionTitle: null,
  activeEventId: null,
  captures: [],
  captureKind: "note",
  actions: [],
  agendaItems: [],
  prep: null,
  prepBusy: false,
  prepError: null,
  timeNotice: null,

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadJson<Partial<Settings>>(SETTINGS_KEY, {});
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
      hotkey: {
        ...DEFAULT_SETTINGS.hotkey,
        ...loaded.hotkey,
      },
    };
    if (!settings.trialStartedAt && !settings.unlockPro) {
      settings.trialStartedAt = new Date().toISOString();
      persistSettings(settings);
    }
    let notes = loadJson<NoteFile[]>(NOTES_KEY, []);
    if (notes.length === 0) {
      notes = seedHistoryNotes(new Date());
      persistNotes(notes);
    }
    let usage = loadJson<Usage>(USAGE_KEY, {
      month: monthKey(),
      streamedMs: 0,
    });
    if (usage.month !== monthKey()) {
      usage = { month: monthKey(), streamedMs: 0 };
      persistUsage(usage);
    }
    let actions = loadJson<ActionItem[]>(ACTIONS_KEY, []);
    if (actions.length === 0) {
      actions = seedOpenActions(new Date());
      persistActions(actions);
    }
    const events = buildDemoEvents(new Date());
    set({
      hydrated: true,
      settings,
      notes,
      usage,
      events,
      actions,
      clock: Date.now(),
      fairUseStopped: usage.streamedMs >= FAIR_USE_MS,
      activeEventId: nextEvent(events)?.id ?? null,
    });
  },

  tick: () => {
    const now = Date.now();
    const { settings, isOn, offer, events, timeNotice, activeEventId } = get();
    set({ clock: now });
    if (
      isOn &&
      settings.warnBeforeEnd !== false
    ) {
      const ev = eventById(events, activeEventId);
      if (ev) {
        const left = new Date(ev.end).getTime() - now;
        if (left <= 0 && timeNotice?.kind !== "over") {
          set({
            timeNotice: { kind: "over", eventTitle: ev.title },
            listenHint: "Calendar time is over — wrap up when you are ready.",
          });
        } else if (
          left > 0 &&
          left <= 5 * 60 * 1000 &&
          timeNotice?.kind !== "five" &&
          timeNotice?.kind !== "over"
        ) {
          set({
            timeNotice: { kind: "five", eventTitle: ev.title },
            listenHint: "Five minutes left.",
          });
        }
      }
    }
    if (!settings.autoOfferCalendar || isOn || offer) return;
    const soon = eventStartingSoon(events, 5 * 60 * 1000, now);
    if (soon) {
      set({
        offer: {
          id: `cal-${soon.id}`,
          reason: "calendar",
          eventTitle: soon.title,
          eventId: soon.id,
        },
      });
    }
  },

  patchSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    persistSettings(settings);
    set({ settings });
  },

  setHotkey: (hotkey) => {
    const settings = { ...get().settings, hotkey };
    persistSettings(settings);
    set({ settings });
  },

  togglePopover: (open) => {
    set((s) => ({
      popoverOpen: open ?? !s.popoverOpen,
    }));
  },

  setActiveWindow: (name) => {
    if (!name) {
      set({ activeWindow: null });
      return;
    }
    get().focusWindow(name);
  },

  closeWindow: (name) => {
    set((s) => {
      const windowOrder = s.windowOrder.filter((w) => w !== name);
      return {
        windowOrder,
        activeWindow: windowOrder[windowOrder.length - 1] ?? null,
      };
    });
  },

  focusWindow: (name) => {
    set((s) => ({
      activeWindow: name,
      windowOrder: [...s.windowOrder.filter((w) => w !== name), name],
    }));
  },

  toggleMode: () => {
    if (get().isOn) void get().stopMode();
    else get().startMode("toggle");
  },

  startMode: (source, eventId, templateId) => {
    const { isOn, events, notes, settings, offer } = get();
    if (isOn) {
      set({ popoverOpen: true, offer: null });
      return;
    }
    const template = templateById(templateId);
    const fromOffer = offer?.eventId;
    const ev = template
      ? null
      : eventById(events, eventId) ??
        eventById(events, fromOffer) ??
        eventById(events, get().activeEventId) ??
        nextEvent(events);
    const title = template?.title ?? ev?.title ?? "Meeting";
    const agenda = template?.agenda ?? ev?.agenda ?? [];
    const started = new Date();
    const filename = noteFilename(started);
    const note: NoteFile = {
      id: `${started.getTime()}`,
      filename,
      title,
      createdAt: started.toISOString(),
      content: buildNoteMarkdown({
        title,
        startedAt: started,
        eventStart: ev?.start,
        eventEnd: ev?.end,
        conferenceUrl: ev?.conferenceUrl,
        conferenceLabel: ev?.conferenceLabel,
        attendees: ev?.attendees,
        agenda,
        talkingPoints: settings.agenda,
      }),
    };
    const nextNotes = [note, ...notes];
    persistNotes(nextNotes);
    set({
      isOn: true,
      dndOn: true,
      musicPaused: true,
      popoverOpen: false,
      offer: null,
      currentNoteId: note.id,
      notes: nextNotes,
      wrapUp: null,
      wrapUpError: null,
      captures: [],
      sessionStartedAt: started.getTime(),
      sessionTitle: title,
      activeEventId: ev?.id ?? null,
      agendaItems: agenda.map((text, i) => ({
        id: `ag-${i}-${text.slice(0, 16)}`,
        text,
        done: false,
      })),
      prep: null,
      prepError: null,
      timeNotice: null,
      listenHint:
        source === "offer"
          ? "Meeting Mode on. Capture as you go — listening stays off until you start it."
          : null,
    });
    get().focusWindow("briefing");
  },

  stopMode: async () => {
    const s = get();
    if (s.listening) s.stopListen();
    const hasMaterial =
      s.captures.length > 0 || s.transcript.trim().length > 0;
    const shouldWrap = s.settings.saveWrapUp && s.currentNoteId && hasMaterial;

    set({
      isOn: false,
      dndOn: false,
      musicPaused: false,
      popoverOpen: false,
      consentOpen: false,
      cues: null,
      sessionStartedAt: null,
      timeNotice: null,
    });

    if (shouldWrap) {
      await runWrapUp(get, set);
    }
  },

  requestListen: () => {
    const { settings, fairUseStopped } = get();
    if (!isPro(settings)) {
      set({ trialOpen: true, popoverOpen: true });
      return;
    }
    if (fairUseStopped) {
      set({
        listenHint:
          "Fair-use limit reached (20 hours this month). Streaming stopped.",
        popoverOpen: true,
      });
      return;
    }
    set({ consentOpen: true, popoverOpen: true });
  },

  confirmListen: () => {
    const { settings, fairUseStopped } = get();
    if (!isPro(settings) || fairUseStopped) {
      set({ consentOpen: false });
      return;
    }
    set({
      listening: true,
      consentOpen: false,
      listenStartedAt: Date.now(),
      transcript: "",
      outline: [],
      cues: null,
      cuesError: null,
      recordingChunks: [],
      audioUploading: false,
      usingDemoAudio: true,
      listenHint: null,
    });
  },

  declineListen: () => set({ consentOpen: false }),

  stopListen: () => {
    set({
      listening: false,
      listenStartedAt: null,
      audioUploading: false,
      micActive: false,
      usingDemoAudio: false,
    });
  },

  startTrial: () => {
    const settings = {
      ...get().settings,
      trialStartedAt: new Date().toISOString(),
    };
    persistSettings(settings);
    set({ settings, trialOpen: false });
  },

  dismissTrial: () => set({ trialOpen: false }),

  openJoin: () => {
    const ev = selectActiveEvent(get());
    const url = ev?.conferenceUrl;
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  },

  updateCurrentNote: (content) => {
    const id = get().currentNoteId;
    if (!id) return;
    const notes = get().notes.map((n) => (n.id === id ? { ...n, content } : n));
    persistNotes(notes);
    set({ notes });
  },

  processSampleTranscript: async () => {
    const { notes } = get();
    if (!get().isOn) get().startMode("toggle", "evt-pipeline");
    const started = new Date();
    const sampleCaptures: Capture[] = [
      {
        id: "cap-1",
        kind: "action",
        text: "Alex sends Acme usage today",
        at: started.toISOString(),
        owner: "Alex",
        due: "",
      },
      {
        id: "cap-2",
        kind: "decision",
        text: "Pause self-serve until Acme is signed",
        at: started.toISOString(),
      },
      {
        id: "cap-3",
        kind: "question",
        text: "Staff a fourth AE before November?",
        at: started.toISOString(),
      },
      {
        id: "cap-4",
        kind: "parked",
        text: "Hiring until Friday staffing",
        at: started.toISOString(),
      },
    ];
    const id = get().currentNoteId;
    let nextNotes = get().notes.length ? get().notes : notes;
    if (id) {
      let content =
        nextNotes.find((n) => n.id === id)?.content ?? SAMPLE_NOTES;
      for (const c of sampleCaptures) {
        content = insertUnderHeading(content, CAPTURE_HEADING[c.kind], c.text);
      }
      nextNotes = nextNotes.map((n) =>
        n.id === id ? { ...n, content } : n,
      );
      persistNotes(nextNotes);
    }
    set({
      notes: nextNotes,
      transcript: SAMPLE_TRANSCRIPT,
      captures: sampleCaptures,
    });
    await runWrapUp(get, set);
  },

  simulateMic: (app) => {
    if (!app) {
      set({ micApps: [] });
      return;
    }
    const { settings, isOn, offer } = get();
    set({ micApps: [app] });
    if (settings.autoOfferMic && !isOn && !offer) {
      set({
        offer: {
          id: `mic-${app}-${Date.now()}`,
          reason: "mic",
          appName: app,
        },
      });
    }
  },

  dismissOffer: () => set({ offer: null }),
  acceptOffer: () => get().startMode("offer", get().offer?.eventId),

  setCues: (cues, error) => set({ cues, cuesError: error ?? null }),

  appendTranscript: (line) => {
    const next = [get().transcript, line].filter(Boolean).join("\n");
    const trimmed = next.slice(-8000);
    const outline = Array.from(
      new Set(
        [...get().outline, line.replace(/^[^:]+:\s*/, "").slice(0, 72)].filter(
          Boolean,
        ),
      ),
    ).slice(-12);
    set({ transcript: trimmed, outline });
  },

  setMicActive: (v) => set({ micActive: v }),
  setAudioUploading: (v) => set({ audioUploading: v }),
  addRecordingChunk: (blob) => {
    if (!get().settings.keepRecordings) return;
    set((s) => ({ recordingChunks: [...s.recordingChunks, blob] }));
  },
  addStreamedMs: (ms) => {
    let usage = get().usage;
    if (usage.month !== monthKey()) usage = { month: monthKey(), streamedMs: 0 };
    usage = { ...usage, streamedMs: usage.streamedMs + ms };
    persistUsage(usage);
    const fairUseStopped = usage.streamedMs >= FAIR_USE_MS;
    set({ usage, fairUseStopped });
    if (fairUseStopped && get().listening) {
      get().stopListen();
      set({
        listenHint:
          "Fair-use limit reached (20 hours this month). Streaming stopped.",
      });
    }
  },
  setListenHint: (msg) => set({ listenHint: msg }),
  setUsingDemoAudio: (v) => set({ usingDemoAudio: v }),

  setActiveEvent: (id) => set({ activeEventId: id }),

  setCaptureKind: (kind) => set({ captureKind: kind }),

  capture: (raw, kind) => {
    const attendees = selectActiveEvent(get())?.attendees ?? [];
    const parsed = parseCaptureInput(raw, kind ?? get().captureKind, attendees);
    if (!parsed.text) return null;
    if (!get().isOn) get().startMode("toggle");
    const id = get().currentNoteId;
    if (!id) return null;
    const item: Capture = {
      id: uid(),
      kind: parsed.kind,
      text: parsed.text,
      at: new Date().toISOString(),
      owner: parsed.owner || undefined,
      due: parsed.due || undefined,
    };
    const bullet =
      parsed.kind === "action"
        ? formatActionLine(parsed)
        : parsed.text;
    const notes = get().notes.map((n) =>
      n.id === id
        ? {
            ...n,
            content: insertUnderHeading(
              n.content,
              CAPTURE_HEADING[parsed.kind],
              bullet,
            ),
          }
        : n,
    );
    persistNotes(notes);
    let actions = get().actions;
    if (parsed.kind === "action") {
      const incoming: ActionItem = {
        id: item.id,
        text: parsed.text,
        owner: parsed.owner || "Unassigned",
        due: parsed.due,
        done: false,
        createdAt: item.at,
        meetingTitle: get().sessionTitle ?? "Meeting",
        noteId: id,
        source: "capture",
      };
      actions = mergeActions(actions, [incoming]);
      persistActions(actions);
    }
    set((s) => ({
      notes,
      actions,
      captures: [...s.captures, item],
      listenHint: null,
    }));
    return item;
  },

  requestWrapUp: async () => {
    if (!get().currentNoteId) return;
    await runWrapUp(get, set);
  },

  toggleAgenda: (id) => {
    const agendaItems = get().agendaItems.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    set({ agendaItems });
  },

  toggleAction: (id) => {
    const actions = get().actions.map((a) =>
      a.id === id ? { ...a, done: !a.done } : a,
    );
    persistActions(actions);
    set({ actions });
  },

  addManualAction: (raw) => {
    const attendees = selectActiveEvent(get())?.attendees ?? [];
    const parsed = parseCaptureInput(raw, "action", attendees);
    if (!parsed.text) return;
    const incoming: ActionItem = {
      id: uid(),
      text: parsed.text,
      owner: parsed.owner || "Unassigned",
      due: parsed.due,
      done: false,
      createdAt: new Date().toISOString(),
      meetingTitle: get().sessionTitle ?? "Inbox",
      source: "manual",
    };
    const actions = mergeActions(get().actions, [incoming]);
    persistActions(actions);
    set({ actions });
  },

  requestPrep: async () => {
    if (get().prepBusy) return;
    const s = get();
    const ev = selectActiveEvent(s);
    const title = s.sessionTitle ?? ev?.title ?? "Meeting";
    const last = relatedNote(s.notes, title, s.currentNoteId);
    const attendees = ev?.attendees ?? [];
    const open = relatedActions(s.actions, attendees, title);
    set({ prepBusy: true, prepError: null });
    get().focusWindow("briefing");
    try {
      const result = await prepMeeting({
        data: {
          title,
          attendees: attendees.join(", "),
          agenda: s.agendaItems.map((a) => `- ${a.text}`).join("\n"),
          lastNotes: (last?.summaryContent ?? last?.content ?? "").slice(0, 1800),
          openActions: open
            .map((a) => `- ${a.owner}: ${a.text}${a.due ? ` (due ${a.due})` : ""}`)
            .join("\n"),
          userContext: s.settings.userContext,
          userKey: s.settings.xaiApiKey || undefined,
        },
      });
      set({ prep: result, prepBusy: false });
    } catch (err) {
      set({
        prepBusy: false,
        prepError: err instanceof Error ? err.message : "Prep failed",
      });
    }
  },

  dismissTimeNotice: () => set({ timeNotice: null }),
}));

async function runWrapUp(
  get: () => MeetingStore,
  set: (
    partial:
      | Partial<MeetingStore>
      | ((s: MeetingStore) => Partial<MeetingStore>),
  ) => void,
) {
  const {
    settings,
    currentNoteId,
    notes,
    transcript,
    captures,
    agendaItems,
    sessionTitle,
  } = get();
  const note = notes.find((n) => n.id === currentNoteId);
  const body =
    transcript.trim() ||
    capturesAsTranscript(captures) ||
    note?.content ||
    "";
  const covered = agendaItems
    .filter((a) => a.done)
    .map((a) => `- ${a.text}`)
    .join("\n");
  const skipped = agendaItems
    .filter((a) => !a.done)
    .map((a) => `- ${a.text}`)
    .join("\n");
  set({ wrapUpBusy: true, wrapUpError: null });
  get().focusWindow("wrapup");
  try {
    const result = await wrapUpMeeting({
      data: {
        title: note?.title ?? sessionTitle ?? "Meeting",
        notes: note?.content ?? "",
        transcript: body,
        agendaCovered: covered,
        agendaSkipped: skipped,
        userKey: settings.xaiApiKey || undefined,
      },
    });
    const summaryFilename = (note?.filename ?? "meeting.md").replace(
      /\.md$/,
      ".summary.md",
    );
    const summaryContent = buildSummaryMarkdown({
      title: note?.title ?? "Meeting",
      ...result,
    });
    const nextNotes = notes.map((n) =>
      n.id === currentNoteId
        ? { ...n, summaryFilename, summaryContent }
        : n,
    );
    persistNotes(nextNotes);
    const incoming: ActionItem[] = result.actions
      .filter((a) => a.task.trim())
      .map((a) => ({
        id: uid(),
        text: a.task,
        owner: a.owner || "Unassigned",
        due: a.due,
        done: false,
        createdAt: new Date().toISOString(),
        meetingTitle: note?.title ?? sessionTitle ?? "Meeting",
        noteId: currentNoteId ?? undefined,
        source: "wrapup" as const,
      }));
    const actions = mergeActions(get().actions, incoming);
    persistActions(actions);
    set({
      wrapUp: result,
      wrapUpBusy: false,
      notes: nextNotes,
      actions,
    });
    get().focusWindow("wrapup");
  } catch (err) {
    set({
      wrapUpBusy: false,
      wrapUpError: err instanceof Error ? err.message : "Wrap-up failed",
    });
  }
}

export function selectCurrentNote(s: MeetingStore) {
  return s.notes.find((n) => n.id === s.currentNoteId) ?? s.notes[0] ?? null;
}

export function selectActiveEvent(s: MeetingStore) {
  return (
    eventById(s.events, s.activeEventId) ?? nextEvent(s.events, s.clock)
  );
}

export function selectNextEvent(s: MeetingStore) {
  return selectActiveEvent(s);
}

export function selectUpcoming(s: MeetingStore) {
  return upcomingEvents(s.events, s.clock);
}

export function selectLastRelated(s: MeetingStore) {
  const title = s.sessionTitle ?? selectActiveEvent(s)?.title;
  if (!title) return null;
  return relatedNote(s.notes, title, s.currentNoteId);
}

export function selectElapsedMs(s: MeetingStore) {
  if (!s.isOn || !s.sessionStartedAt) return 0;
  return Math.max(0, s.clock - s.sessionStartedAt);
}

export function selectSessionTitle(s: MeetingStore) {
  return s.sessionTitle ?? selectActiveEvent(s)?.title ?? "Meeting";
}

export function selectOpenActionCount(s: MeetingStore) {
  return s.actions.filter((a) => !a.done).length;
}
