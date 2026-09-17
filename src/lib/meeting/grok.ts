import { createServerFn } from "@tanstack/react-start";
import type { LiveCues, WrapUpResult } from "./types";

const MODEL = "grok-4.5";

function apiKey(userKey?: string) {
  return process.env.XAI_API_KEY?.trim() || userKey?.trim() || "";
}

function extractJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

async function chat(input: {
  system: string;
  user: string;
  maxTokens: number;
  userKey?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = apiKey(input.userKey);
  if (!key) {
    return { ok: false, error: "AI is not available in this environment" };
  }
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: input.maxTokens,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false, error: `xAI API error ${res.status}` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
}

export const wrapUpMeeting = createServerFn({ method: "POST" })
  .validator(
    (input: {
      title: string;
      notes: string;
      transcript: string;
      userKey?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<WrapUpResult> => {
    const system = `You write meeting wrap-ups. Output JSON only, no markdown:
{
  "summary": "",
  "decisions": [""],
  "actions": [{"owner": "", "task": "", "due": ""}],
  "open_questions": [""],
  "followup_email": ""
}
Rules: no invented facts or numbers. If owner is unknown use "Unassigned". due is YYYY-MM-DD or "". followup_email is a plain email body ready to send. Keep summary to 2-5 sentences.`;

    const user = `Event title: ${data.title}

User notes:
${data.notes || "(none)"}

Transcript:
${data.transcript}`;

    const result = await chat({
      system,
      user,
      maxTokens: 900,
      userKey: data.userKey,
    });
    if (!result.ok) {
      return offlineWrapUp(data, result.error);
    }
    const parsed = extractJson<Omit<WrapUpResult, "source" | "error">>(
      result.text,
    );
    if (!parsed?.summary) {
      return offlineWrapUp(data, "Could not parse wrap-up JSON");
    }
    return {
      summary: parsed.summary,
      decisions: parsed.decisions ?? [],
      actions: (parsed.actions ?? []).map((a) => ({
        owner: a.owner || "Unassigned",
        task: a.task || "",
        due: a.due || "",
      })),
      open_questions: parsed.open_questions ?? [],
      followup_email: parsed.followup_email || "",
      source: "grok",
    };
  });

function offlineWrapUp(
  data: { title: string; notes: string; transcript: string },
  error: string,
): WrapUpResult {
  const lines = data.transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const decisions = lines
    .filter((l) => /decision:/i.test(l))
    .map((l) => l.replace(/^.*decision:\s*/i, ""));
  return {
    summary: `Offline draft for “${data.title}”. ${lines.slice(0, 3).join(" ")}`.trim(),
    decisions: decisions.length ? decisions : ["None captured offline."],
    actions: [
      {
        owner: "Unassigned",
        task: "Review transcript and confirm owners",
        due: "",
      },
    ],
    open_questions: lines
      .filter((l) => /open question|still needs|\?/i.test(l))
      .slice(0, 4),
    followup_email: `Hi all,\n\nNotes from ${data.title}:\n\n${data.notes || "(add notes)"}\n\nThanks`,
    source: "offline",
    error,
  };
}

export const liveMeetingCues = createServerFn({ method: "POST" })
  .validator(
    (input: {
      mode: string;
      userContext: string;
      agenda: string;
      recent: string;
      userKey?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<LiveCues & { error?: string }> => {
    const system = `You are a quiet meeting copilot. Output JSON only:
{ "now": "", "say": ["", ""], "watch": "", "parked": "" }
Max 12 words per field. No fluff. No invented facts or numbers.
Mode: ${data.mode}
User context: ${data.userContext}
Agenda: ${data.agenda}`;

    const result = await chat({
      system,
      user: `Recent transcript:\n${data.recent}`,
      maxTokens: 180,
      userKey: data.userKey,
    });
    if (!result.ok) {
      return {
        now: "",
        say: [],
        watch: "",
        parked: "",
        error: result.error,
      };
    }
    const parsed = extractJson<LiveCues>(result.text);
    if (!parsed) {
      return { now: "", say: [], watch: "", parked: "", error: "Bad JSON" };
    }
    const say = (parsed.say ?? []).filter(Boolean).slice(0, 2);
    return {
      now: (parsed.now ?? "").trim(),
      say,
      watch: (parsed.watch ?? "").trim(),
      parked: (parsed.parked ?? "").trim(),
    };
  });

export const transcribeChunk = createServerFn({ method: "POST" })
  .validator(
    (input: { audioBase64: string; mimeType: string; userKey?: string }) =>
      input,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
      const key = apiKey(data.userKey);
      if (!key) return { ok: false, error: "AI is not available" };
      if (data.audioBase64.length > 1_800_000) {
        return { ok: false, error: "Chunk too large" };
      }
      const binary = Buffer.from(data.audioBase64, "base64");
      const ext = data.mimeType.includes("wav")
        ? "wav"
        : data.mimeType.includes("mpeg")
          ? "mp3"
          : "webm";
      const form = new FormData();
      form.append("language", "en");
      form.append(
        "file",
        new Blob([binary], { type: data.mimeType || "audio/webm" }),
        `chunk.${ext}`,
      );
      const res = await fetch("https://api.x.ai/v1/stt", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      if (!res.ok) {
        return { ok: false, error: `STT error ${res.status}` };
      }
      const body = (await res.json()) as { text?: string };
      return { ok: true, text: (body.text ?? "").trim() };
    },
  );
