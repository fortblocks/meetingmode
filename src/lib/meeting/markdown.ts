function escapeHtml(s: string) {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function inline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    out.push(`<ul>${list.join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    flushList();
    if (line.startsWith("# ")) {
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.trim() === "") {
      out.push("");
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}

export function buildNoteMarkdown(input: {
  title: string;
  startedAt: Date;
  eventStart?: string;
  eventEnd?: string;
  conferenceUrl?: string;
  conferenceLabel?: string;
}) {
  const started = input.startedAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines = [
    `# ${input.title}`,
    "",
    `- Folder: ~/Meeting Mode/`,
    `- Started: ${started}`,
  ];
  if (input.eventStart && input.eventEnd) {
    const a = new Date(input.eventStart).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const b = new Date(input.eventEnd).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    lines.push(`- Calendar: ${a} – ${b}`);
  }
  if (input.conferenceUrl) {
    lines.push(
      `- Join (${input.conferenceLabel ?? "call"}): ${input.conferenceUrl}`,
    );
  }
  lines.push("", "## Notes", "", "");
  return lines.join("\n");
}

export function buildSummaryMarkdown(input: {
  title: string;
  summary: string;
  decisions: string[];
  actions: { owner: string; task: string; due: string }[];
  open_questions: string[];
  followup_email: string;
  source: "grok" | "offline";
}) {
  const decisions =
    input.decisions.length === 0
      ? "- None recorded"
      : input.decisions.map((d) => `- ${d}`).join("\n");
  const actions =
    input.actions.length === 0
      ? "- None recorded"
      : input.actions
          .map(
            (a) =>
              `- ${a.task} — ${a.owner}${a.due ? ` (due ${a.due})` : ""}`,
          )
          .join("\n");
  const questions =
    input.open_questions.length === 0
      ? "- None recorded"
      : input.open_questions.map((q) => `- ${q}`).join("\n");
  const banner =
    input.source === "offline"
      ? "\n_Offline draft — Grok was unavailable. Review before sending._\n"
      : "";
  return [
    `# Wrap-up — ${input.title}`,
    banner,
    "## Summary",
    "",
    input.summary,
    "",
    "## Decisions",
    decisions,
    "",
    "## Actions",
    actions,
    "",
    "## Open questions",
    questions,
    "",
    "## Follow-up email",
    "",
    input.followup_email,
    "",
  ].join("\n");
}
