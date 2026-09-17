import { parseOwnerDue } from "./actions";
import type { CaptureKind } from "./types";

export const CAPTURE_HEADING: Record<CaptureKind, string> = {
  note: "Notes",
  action: "Actions",
  decision: "Decisions",
  parked: "Parked",
  question: "Open questions",
};

export const CAPTURE_PREFIX: Record<string, CaptureKind> = {
  a: "action",
  d: "decision",
  p: "parked",
  q: "question",
  n: "note",
};

export function parseCaptureInput(
  raw: string,
  fallback: CaptureKind = "note",
  attendees: string[] = [],
): { kind: CaptureKind; text: string; owner: string; due: string } {
  const t = raw.trim();
  const m = t.match(/^\/([adpqn])\s+(.+)$/i);
  const kind = m
    ? (CAPTURE_PREFIX[m[1].toLowerCase()] ?? fallback)
    : fallback;
  const body = m ? m[2].trim() : t;
  if (kind === "action") {
    const meta = parseOwnerDue(body, attendees);
    return { kind, text: meta.text, owner: meta.owner, due: meta.due };
  }
  const at = parseOwnerDue(body, attendees);
  return { kind, text: at.text || body, owner: at.owner, due: at.due };
}

export function insertUnderHeading(
  markdown: string,
  heading: string,
  bullet: string,
): string {
  const line = `- ${bullet.replace(/^\s*[-*]\s+/, "")}`;
  const headingRe = new RegExp(`^## ${heading}\\s*$`, "im");
  const match = headingRe.exec(markdown);
  if (!match) {
    const pad = markdown.endsWith("\n") ? "" : "\n";
    return `${markdown}${pad}\n## ${heading}\n\n${line}\n`;
  }
  const after = match.index + match[0].length;
  const rest = markdown.slice(after);
  const next = rest.search(/\n## /);
  const section = next >= 0 ? rest.slice(0, next) : rest;
  const insertAt = after + section.length;
  const needsNl = !markdown.slice(0, insertAt).endsWith("\n");
  const prefix = needsNl ? "\n" : "";
  return (
    markdown.slice(0, insertAt) +
    `${prefix}${line}\n` +
    markdown.slice(insertAt)
  );
}

export function capturesAsTranscript(
  captures: { kind: CaptureKind; text: string; owner?: string; due?: string }[],
) {
  if (!captures.length) return "";
  return captures
    .map((c) => {
      const who = c.owner ? ` (${c.owner}${c.due ? `, ${c.due}` : ""})` : "";
      return `${c.kind[0].toUpperCase()}${c.kind.slice(1)}: ${c.text}${who}`;
    })
    .join("\n");
}
