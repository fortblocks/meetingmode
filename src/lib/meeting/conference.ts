const CONFERENCE_HOSTS: { host: string; label: string }[] = [
  { host: "zoom.us", label: "Zoom" },
  { host: "meet.google.com", label: "Meet" },
  { host: "teams.microsoft.com", label: "Teams" },
];

const URL_RE = /https?:\/\/[^\s)>\]"']+/gi;

export function findConferenceLink(text: string | undefined | null): {
  url: string;
  label: string;
} | null {
  if (!text) return null;
  const matches = text.match(URL_RE) ?? [];
  for (const raw of matches) {
    const url = raw.replace(/[.,;]+$/, "");
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const found = CONFERENCE_HOSTS.find(
        (c) => host === c.host || host.endsWith(`.${c.host}`),
      );
      if (found) return { url, label: found.label };
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function conferenceFromEvent(event: {
  url?: string;
  notes?: string;
  location?: string;
}) {
  return (
    findConferenceLink(event.url) ??
    findConferenceLink(event.location) ??
    findConferenceLink(event.notes)
  );
}
