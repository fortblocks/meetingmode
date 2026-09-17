import { conferenceFromEvent } from "./conference";
import type { CalendarEvent } from "./types";

function iso(d: Date) {
  return d.toISOString();
}

export function buildDemoEvents(now = new Date()): CalendarEvent[] {
  const t = now.getTime();
  const raw: Omit<CalendarEvent, "conferenceUrl" | "conferenceLabel">[] = [
    {
      id: "evt-pipeline",
      title: "Q3 pipeline review",
      start: iso(new Date(t + 4 * 60 * 1000)),
      end: iso(new Date(t + 34 * 60 * 1000)),
      location: "https://meet.google.com/q3-pipe-rev",
      notes:
        "Deck in Drive. Join with Meet: https://meet.google.com/q3-pipe-rev",
      url: "https://meet.google.com/q3-pipe-rev",
    },
    {
      id: "evt-design",
      title: "Design critique — onboarding",
      start: iso(new Date(t + 2 * 60 * 60 * 1000)),
      end: iso(new Date(t + 2.5 * 60 * 60 * 1000)),
      notes: "Zoom: https://zoom.us/j/84729103654",
      url: "https://zoom.us/j/84729103654",
    },
    {
      id: "evt-maya",
      title: "1:1 with Maya",
      start: iso(new Date(t + 26 * 60 * 60 * 1000)),
      end: iso(new Date(t + 26.5 * 60 * 60 * 1000)),
      location: "https://teams.microsoft.com/l/meetup-join/demo",
      notes: "Career chat. Teams link in location.",
    },
    {
      id: "evt-staffing",
      title: "Staffing for Q4",
      start: iso(new Date(t + 5 * 60 * 60 * 1000)),
      end: iso(new Date(t + 6 * 60 * 60 * 1000)),
      notes: "Conference room B. No video link.",
    },
  ];

  return raw.map((event) => {
    const conf = conferenceFromEvent(event);
    return {
      ...event,
      conferenceUrl: conf?.url,
      conferenceLabel: conf?.label,
    };
  });
}

export function nextEvent(
  events: CalendarEvent[],
  now = Date.now(),
): CalendarEvent | null {
  const upcoming = events
    .filter((e) => new Date(e.end).getTime() > now)
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  return upcoming[0] ?? null;
}

export function eventStartingSoon(
  events: CalendarEvent[],
  windowMs = 5 * 60 * 1000,
  now = Date.now(),
): CalendarEvent | null {
  return (
    events.find((e) => {
      if (!e.conferenceUrl) return false;
      const start = new Date(e.start).getTime();
      return start > now && start - now <= windowMs;
    }) ?? null
  );
}
