export type MeetingTemplateId = "oneonone" | "standup" | "sales" | "blank";

export type MeetingTemplate = {
  id: MeetingTemplateId;
  title: string;
  label: string;
  hint: string;
  agenda: string[];
};

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: "oneonone",
    title: "1:1",
    label: "Start a 1:1",
    hint: "Wins, blockers, growth",
    agenda: [
      "Wins since last time",
      "Blockers",
      "Growth",
      "What to drop",
    ],
  },
  {
    id: "standup",
    title: "Standup",
    label: "Start standup",
    hint: "Yesterday, today, stuck",
    agenda: ["Yesterday", "Today", "Blockers"],
  },
  {
    id: "sales",
    title: "Sales call",
    label: "Start a sales call",
    hint: "Pain, next step, risk",
    agenda: ["Context", "Pain", "Next step", "Risks"],
  },
  {
    id: "blank",
    title: "Meeting",
    label: "Start blank",
    hint: "No agenda, just a note",
    agenda: [],
  },
];

export function templateById(id: MeetingTemplateId | undefined) {
  if (!id) return null;
  return MEETING_TEMPLATES.find((t) => t.id === id) ?? null;
}
