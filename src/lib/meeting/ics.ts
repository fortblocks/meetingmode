import { createServerFn } from "@tanstack/react-start";
import { conferenceFromEvent } from "./conference";
import type { CalendarEvent } from "./types";

const ALLOWED_HOSTS = new Set([
  "calendar.google.com",
  "www.google.com",
  "calendar.googleusercontent.com",
]);

export function normalizeIcsUrl(raw: string) {
  return raw.trim().replace(/^webcal:/i, "https:");
}

export function isAllowedIcsUrl(raw: string) {
  try {
    const u = new URL(normalizeIcsUrl(raw));
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) return false;
    if (host === "www.google.com" && !u.pathname.startsWith("/calendar")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function unfold(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeIcs(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDate(raw: string): Date | null {
  const value = raw.includes(":") ? raw.slice(raw.lastIndexOf(":") + 1) : raw;
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/,
  );
  if (!m || !m[4]) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = Number(m[6]);
  if (m[7] === "Z") return new Date(Date.UTC(y, mo, d, h, mi, s));
  return new Date(y, mo, d, h, mi, s);
}

function param(line: string, name: string) {
  const m = line.match(new RegExp(`(?:^|;)${name}=([^;:]+)`, "i"));
  return m ? unescapeIcs(m[1].replace(/^"|"$/g, "")) : "";
}

export function parseIcs(ics: string, now = Date.now()): CalendarEvent[] {
  const text = unfold(ics);
  const blocks = text.split(/BEGIN:VEVENT/i).slice(1);
  const horizon = now + 36 * 60 * 60 * 1000;
  const events: CalendarEvent[] = [];
  for (const block of blocks) {
    const body = block.split(/END:VEVENT/i)[0] ?? "";
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    const get = (key: string) => {
      const line = lines.find((l) =>
        l.toUpperCase().startsWith(key.toUpperCase()),
      );
      if (!line) return "";
      const idx = line.indexOf(":");
      return idx >= 0 ? unescapeIcs(line.slice(idx + 1)) : "";
    };
    const start = parseIcsDate(
      lines.find((l) => l.toUpperCase().startsWith("DTSTART")) ?? "",
    );
    const end = parseIcsDate(
      lines.find((l) => l.toUpperCase().startsWith("DTEND")) ?? "",
    );
    if (!start || !end) continue;
    if (end.getTime() <= now || start.getTime() > horizon) continue;
    const title = get("SUMMARY") || "Untitled";
    const location = get("LOCATION");
    const notes = get("DESCRIPTION");
    const url = get("URL");
    const attendees = lines
      .filter((l) => l.toUpperCase().startsWith("ATTENDEE"))
      .map((l) => param(l, "CN") || (l.split(":").pop() ?? "").replace(/^mailto:/i, ""))
      .filter((n) => n && !n.includes("@"))
      .slice(0, 8);
    const agenda = notes
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-") || l.startsWith("*"))
      .map((l) => l.replace(/^[-*]\s*/, ""));
    const raw: CalendarEvent = {
      id: get("UID") || `ics-${start.getTime()}-${title.slice(0, 24)}`,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      location: location || undefined,
      notes: notes || undefined,
      url: url || undefined,
      attendees,
      agenda,
      calendarLabel: "Google",
    };
    const conf = conferenceFromEvent(raw);
    events.push({
      ...raw,
      conferenceUrl: conf?.url,
      conferenceLabel: conf?.label,
    });
  }
  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

export const fetchGoogleIcs = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; events: CalendarEvent[] }
      | { ok: false; error: string }
    > => {
      const url = normalizeIcsUrl(data.url);
      if (!isAllowedIcsUrl(url)) {
        return {
          ok: false,
          error: "Use a Google Calendar secret iCal address (https://calendar.google.com/…)",
        };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "text/calendar, text/plain, */*" },
        });
        if (!res.ok) {
          return { ok: false, error: `Google Calendar returned ${res.status}` };
        }
        const text = await res.text();
        if (text.length > 1_500_000) {
          return { ok: false, error: "Calendar file is too large" };
        }
        if (!/BEGIN:VCALENDAR/i.test(text)) {
          return { ok: false, error: "That URL is not an iCal calendar" };
        }
        return { ok: true, events: parseIcs(text) };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error && err.name === "AbortError"
              ? "Google Calendar timed out"
              : "Could not load Google Calendar",
        };
      } finally {
        clearTimeout(timer);
      }
    },
  );
