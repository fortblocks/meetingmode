export type ListenMode = "internal" | "sales" | "standup" | "silent";

export type CaptureKind =
  | "note"
  | "action"
  | "decision"
  | "parked"
  | "question";

export type Capture = {
  id: string;
  kind: CaptureKind;
  text: string;
  at: string;
  owner?: string;
  due?: string;
};

export type AgendaItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ActionItem = {
  id: string;
  text: string;
  owner: string;
  due: string;
  done: boolean;
  createdAt: string;
  meetingTitle: string;
  noteId?: string;
  source: "capture" | "wrapup" | "seed" | "manual";
};

export type PrepResult = {
  talkingPoints: string[];
  remember: string[];
  questions: string[];
  source: "grok" | "offline";
  error?: string;
};

export type TimeNotice = {
  kind: "five" | "over";
  eventTitle: string;
};

export type MicApp =
  | "Zoom"
  | "Teams"
  | "FaceTime"
  | "Slack"
  | "Webex"
  | "Discord";

export type Hotkey = {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
};

export const DEFAULT_HOTKEY: Hotkey = {
  ctrl: true,
  alt: true,
  shift: false,
  meta: false,
  key: "m",
};

export type Settings = {
  hotkey: Hotkey;
  autoOfferCalendar: boolean;
  autoOfferMic: boolean;
  xaiApiKey: string;
  unlockPro: boolean;
  trialStartedAt: string | null;
  keepRecordings: boolean;
  saveWrapUp: boolean;
  hideCuesFromRecordings: boolean;
  listenMode: ListenMode;
  userContext: string;
  agenda: string;
  warnBeforeEnd: boolean;
  googleIcsUrl: string;
};

export const DEFAULT_SETTINGS: Settings = {
  hotkey: DEFAULT_HOTKEY,
  autoOfferCalendar: true,
  autoOfferMic: true,
  xaiApiKey: "",
  unlockPro: false,
  trialStartedAt: null,
  keepRecordings: false,
  saveWrapUp: true,
  hideCuesFromRecordings: false,
  listenMode: "internal",
  userContext: "Staff engineer at a 40-person B2B product team.",
  agenda: "Pipeline, Acme renewal, staffing for Q4.",
  warnBeforeEnd: true,
  googleIcsUrl: "",
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  notes?: string;
  url?: string;
  conferenceUrl?: string;
  conferenceLabel?: string;
  attendees?: string[];
  agenda?: string[];
  calendarLabel?: string;
};

export type NoteFile = {
  id: string;
  filename: string;
  title: string;
  createdAt: string;
  content: string;
  summaryFilename?: string;
  summaryContent?: string;
};

export type LiveCues = {
  now: string;
  say: string[];
  watch: string;
  parked: string;
};

export type WrapUpResult = {
  summary: string;
  decisions: string[];
  actions: { owner: string; task: string; due: string }[];
  open_questions: string[];
  followup_email: string;
  source: "grok" | "offline";
  error?: string;
};

export type OfferNotification = {
  id: string;
  reason: "mic" | "calendar";
  appName?: MicApp;
  eventTitle?: string;
  eventId?: string;
};

export const FAIR_USE_MS = 20 * 60 * 60 * 1000;
export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
export const CUE_INTERVAL_MS = 10_000;
export const TRANSCRIPT_WINDOW_MS = 90_000;
export const MAX_CUE_CALLS_PER_SESSION = 8;
export const MAX_STT_CHUNKS_PER_SESSION = 6;

export const MODE_LABEL: Record<ListenMode, string> = {
  internal: "Internal",
  sales: "Sales",
  standup: "Standup",
  silent: "Silent",
};

export const CAPTURE_LABEL: Record<CaptureKind, string> = {
  note: "Note",
  action: "Action",
  decision: "Decision",
  parked: "Parked",
  question: "Question",
};

export const SETTINGS_PATH =
  "~/Library/Application Support/MeetingMode/settings.json";
export const NOTES_PATH = "~/Meeting Mode/";
