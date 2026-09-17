import { renderMarkdown } from "@/lib/meeting/markdown";
import { selectCurrentNote, useMeeting } from "@/lib/meeting/store";
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
  const patch = (id: string) =>
    useMeeting.setState({ currentNoteId: id, activeWindow: "notes" });

  return (
    <MacWindow
      title={current ? current.filename : "Meeting Mode"}
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      paper
      widthClass="w-[min(94vw,640px)]"
    >
      <div className="flex min-h-80 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-paper-fg/10 md:w-44 md:border-r">
          <p className="px-3 pt-3 text-micro font-medium tracking-wide text-paper-muted uppercase">
            ~/Meeting Mode
          </p>
          <ul className="mt-2">
            {notes.length === 0 ? (
              <li className="px-3 py-2 text-sm text-paper-muted">
                Empty — turn Meeting Mode on
              </li>
            ) : (
              notes.map((n) => (
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
                  {n.summaryFilename ? (
                    <p className="px-3 pb-2 text-micro text-paper-muted">
                      {n.summaryFilename}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 p-4">
          {current ? (
            <>
              <label className="sr-only" htmlFor="note-editor">
                Meeting notes
              </label>
              <textarea
                id="note-editor"
                value={current.content}
                onChange={(e) => update(e.target.value)}
                className="mb-4 h-40 w-full resize-y rounded-md bg-paper-fg/5 px-3 py-2 font-mono text-xs text-paper-fg outline-none"
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
