import { create } from "zustand";
import { buildDemoEvents, eventStartingSoon, nextEvent } from "./calendar";
import { SAMPLE_NOTES, SAMPLE_TRANSCRIPT } from "./fixtures";
import { wrapUpMeeting } from "./grok";
import { buildNoteMarkdown, buildSummaryMarkdown } from "./markdown";
import { isPro } from "./pro";
import {
  DEFAULT_SETTINGS,
  FAIR_USE_MS,
  type CalendarEvent,
  type Hotkey,
  type LiveCues,
  type MicApp,
  type NoteFile,
  type OfferNotification,
  type Settings,
  type WrapUpResult,
} from "./types";
import { monthKey, noteFilename } from "../utils";

const SETTINGS_KEY = "meeting-mode:settings";
const NOTES_KEY = "meeting-mode:notes";
const USAGE_KEY = "meeting-mode:usage";

type Usage = { month: string; streamedMs: number };

type WindowName = "settings" | "notes" | "wrapup";

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

  hydrate: () => void;
  tick: () => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setHotkey: (hotkey: Hotkey) => void;
  togglePopover: (open?: boolean) => void;
  setActiveWindow: (name: WindowName | null) => void;
  closeWindow: (name: WindowName) => void;
  focusWindow: (name: WindowName) => void;
  toggleMode: () => void;
  startMode: (source?: "hotkey" | "toggle" | "offer") => void;
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
  wrapUpBusy: false,
  wrapUpError: null,
  cues: null,
  cuesError: null,
  transcript: "",
  outline: [],
  recordingChunks: [],
  offer: null,
  micApps: [],
  clock: Date.now(),
  listenHint: null,

  hydrate: () => {
    if (get().hydrated) return;
    const settings = {
      ...DEFAULT_SETTINGS,
      ...loadJson<Partial<Settings>>(SETTINGS_KEY, {}),
      hotkey: {
        ...DEFAULT_SETTINGS.hotkey,
        ...loadJson<Partial<Settings>>(SETTINGS_KEY, {}).hotkey,
      },
    };
    const notes = loadJson<NoteFile[]>(NOTES_KEY, []);
    let usage = loadJson<Usage>(USAGE_KEY, {
      month: monthKey(),
      streamedMs: 0,
    });
    if (usage.month !== monthKey()) {
      usage = { month: monthKey(), streamedMs: 0 };
      persistUsage(usage);
    }
    set({
      hydrated: true,
      settings,
      notes,
      usage,
      events: buildDemoEvents(new Date()),
      clock: Date.now(),
      fairUseStopped: usage.streamedMs >= FAIR_USE_MS,
    });
  },

  tick: () => {
    const now = Date.now();
    const { settings, isOn, offer, events } = get();
    set({ clock: now });
    if (!settings.autoOfferCalendar || isOn || offer) return;
    const soon = eventStartingSoon(events, 5 * 60 * 1000, now);
    if (soon) {
      set({
        offer: {
          id: `cal-${soon.id}`,
          reason: "calendar",
          eventTitle: soon.title,
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

  startMode: (source) => {
    const { isOn, events, notes } = get();
    if (isOn) {
      set({ popoverOpen: true, offer: null });
      return;
    }
    const ev = nextEvent(events);
    const title = ev?.title ?? "Meeting";
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
      }),
    };
    const nextNotes = [note, ...notes];
    persistNotes(nextNotes);
    set({
      isOn: true,
      dndOn: true,
      musicPaused: true,
      popoverOpen: true,
      offer: null,
      currentNoteId: note.id,
      notes: nextNotes,
      wrapUp: null,
      wrapUpError: null,
      listenHint:
        source === "offer"
          ? "Meeting Mode on. Listening stays off until you start it."
          : null,
    });
  },

  stopMode: async () => {
    const s = get();
    if (s.listening) s.stopListen();
    const shouldWrap =
      s.settings.saveWrapUp &&
      isPro(s.settings) &&
      s.currentNoteId &&
      (s.transcript.trim().length > 0 || s.notes.find((n) => n.id === s.currentNoteId)?.content.includes("## Notes"));

    set({
      isOn: false,
      dndOn: false,
      musicPaused: false,
      popoverOpen: false,
      consentOpen: false,
      cues: null,
    });

    if (shouldWrap && s.transcript.trim()) {
      await runWrapUp(get, set, s.transcript, false);
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
        listenHint: "Fair-use limit reached (20 hours this month). Streaming stopped.",
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
    const ev = nextEvent(get().events);
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
    const { settings, notes } = get();
    if (!isPro(settings)) {
      set({ trialOpen: true, activeWindow: "settings" });
      get().focusWindow("settings");
      return;
    }
    const started = new Date();
    const filename = noteFilename(started);
    const note: NoteFile = {
      id: `sample-${started.getTime()}`,
      filename,
      title: "Q3 pipeline review",
      createdAt: started.toISOString(),
      content:
        buildNoteMarkdown({
          title: "Q3 pipeline review",
          startedAt: started,
          conferenceUrl: "https://meet.google.com/q3-pipe-rev",
          conferenceLabel: "Meet",
        }) + SAMPLE_NOTES,
    };
    const nextNotes = [note, ...notes];
    persistNotes(nextNotes);
    set({
      notes: nextNotes,
      currentNoteId: note.id,
      transcript: SAMPLE_TRANSCRIPT,
      isOn: true,
      dndOn: true,
      musicPaused: true,
    });
    await runWrapUp(get, set, SAMPLE_TRANSCRIPT, true);
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
  acceptOffer: () => get().startMode("offer"),

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
}));

async function runWrapUp(
  get: () => MeetingStore,
  set: (
    partial:
      | Partial<MeetingStore>
      | ((s: MeetingStore) => Partial<MeetingStore>),
  ) => void,
  transcript: string,
  fromSample: boolean,
) {
  const { settings, currentNoteId, notes } = get();
  const note = notes.find((n) => n.id === currentNoteId);
  set({ wrapUpBusy: true, wrapUpError: null, activeWindow: "wrapup" });
  get().focusWindow("wrapup");
  try {
    const result = await wrapUpMeeting({
      data: {
        title: note?.title ?? "Meeting",
        notes: note?.content ?? (fromSample ? SAMPLE_NOTES : ""),
        transcript,
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
    set({
      wrapUp: result,
      wrapUpBusy: false,
      notes: nextNotes,
    });
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

export function selectNextEvent(s: MeetingStore) {
  return nextEvent(s.events, s.clock);
}
