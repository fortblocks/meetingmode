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
      attendees: ["Maya Chen", "Alex Rivera", "Jordan Hale", "You"],
      agenda: [
        "Last week’s pipeline vs forecast",
        "Acme renewal — unsigned",
        "Self-serve experiment: pause or keep",
        "Staffing a fourth AE before November",
      ],
    },
    {
      id: "evt-design",
      title: "Design critique — onboarding",
      start: iso(new Date(t + 2 * 60 * 60 * 1000)),
      end: iso(new Date(t + 2.5 * 60 * 60 * 1000)),
      notes: "Zoom: https://zoom.us/j/84729103654",
      url: "https://zoom.us/j/84729103654",
      attendees: ["Priya Shah", "Sam Okonkwo", "You"],
      agenda: [
        "Walk the empty-state flow",
        "Decide on the empty-calendar copy",
        "Ship or slip Friday",
      ],
    },
    {
      id: "evt-staffing",
      title: "Staffing for Q4",
      start: iso(new Date(t + 5 * 60 * 60 * 1000)),
      end: iso(new Date(t + 6 * 60 * 60 * 1000)),
      notes: "Conference room B. No video link.",
      attendees: ["Maya Chen", "People partner", "You"],
      agenda: [
        "Headcount leftover from Q3",
        "AE vs CSM for Acme",
        "Park hiring until Friday if unsigned",
      ],
    },
    {
      id: "evt-maya",
      title: "1:1 with Maya",
      start: iso(new Date(t + 26 * 60 * 60 * 1000)),
      end: iso(new Date(t + 26.5 * 60 * 60 * 1000)),
      location: "https://teams.microsoft.com/l/meetup-join/demo",
      notes: "Career chat. Teams link in location.",
      attendees: ["Maya Chen", "You"],
      agenda: ["Growth", "What to drop", "Q4 shape"],
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
  return upcomingEvents(events, now)[0] ?? null;
}

export function upcomingEvents(
  events: CalendarEvent[],
  now = Date.now(),
  limit = 6,
): CalendarEvent[] {
  return events
    .filter((e) => new Date(e.end).getTime() > now)
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    )
    .slice(0, limit);
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

export function eventById(
  events: CalendarEvent[],
  id: string | null | undefined,
): CalendarEvent | null {
  if (!id) return null;
  return events.find((e) => e.id === id) ?? null;
}
