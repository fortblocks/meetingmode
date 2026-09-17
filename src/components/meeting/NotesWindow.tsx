import { useMemo, useState } from "react";
import { renderMarkdown } from "@/lib/meeting/markdown";
import { selectCurrentNote, useMeeting } from "@/lib/meeting/store";
import { CaptureBox } from "./CaptureBox";
import { MacWindow } from "./MacWindow";

export function NotesWindow({
  z,
  onClose,
  onFocus,
}: {
  z: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const notes = useMeeting((s) => s.notes);
  const current = useMeeting(selectCurrentNote);
  const update = useMeeting((s) => s.updateCurrentNote);
  const setId = useMeeting((s) => s.currentNoteId);
  const isOn = useMeeting((s) => s.isOn);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.filename.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.summaryContent ?? "").toLowerCase().includes(q),
    );
  }, [notes, query]);
  const patch = (id: string) =>
    useMeeting.setState({ currentNoteId: id, activeWindow: "notes" });

  return (
    <MacWindow
      title={current ? current.filename : "Meeting Mode"}
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      paper
      widthClass="w-[min(94vw,720px)]"
    >
      <div className="flex min-h-80 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-paper-fg/10 md:w-52 md:border-r">
          <p className="px-3 pt-3 text-micro font-medium tracking-wide text-paper-muted uppercase">
            ~/Meeting Mode
          </p>
          <div className="px-3 pt-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="h-9 w-full rounded-md bg-paper-fg/6 px-2 text-xs outline-none"
            />
          </div>
          <ul className="mt-2 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-paper-muted">
                {notes.length === 0
                  ? "Empty — turn Meeting Mode on"
                  : "No matches"}
              </li>
            ) : (
              filtered.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => patch(n.id)}
                    className={`block w-full truncate px-3 py-2 text-left text-sm ${
                      n.id === setId
                        ? "bg-paper-fg/8 font-medium"
                        : "text-paper-muted"
                    }`}
                  >
                    {n.filename}
                  </button>
                  <p className="px-3 pb-2 text-micro text-paper-muted">
                    {n.title}
                    {n.summaryFilename ? " · wrap-up" : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 p-4">
          {current ? (
            <>
              {isOn ? (
                <div className="mb-4 rounded-md bg-paper-fg/6 p-3">
                  <CaptureBox compact />
                </div>
              ) : null}
              <label className="sr-only" htmlFor="note-editor">
                Meeting notes
              </label>
              <textarea
                id="note-editor"
                value={current.content}
                onChange={(e) => update(e.target.value)}
                className="mb-4 h-48 w-full resize-y rounded-md bg-paper-fg/5 px-3 py-2 font-mono text-xs text-paper-fg outline-none"
              />
              <div
                className="md-body text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(
                    current.summaryContent
                      ? `${current.content}\n\n---\n\n${current.summaryContent}`
                      : current.content,
                  ),
                }}
              />
            </>
          ) : (
            <p className="text-sm text-paper-muted">
              Files stay here when Meeting Mode turns off.
            </p>
          )}
        </div>
      </div>
    </MacWindow>
  );
}
