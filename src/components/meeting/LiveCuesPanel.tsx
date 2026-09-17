import { useRef, useState } from "react";
import { useMeeting } from "@/lib/meeting/store";
import { cn } from "@/lib/utils";

export function LiveCuesPanel() {
  const listening = useMeeting((s) => s.listening);
  const mode = useMeeting((s) => s.settings.listenMode);
  const hide = useMeeting((s) => s.settings.hideCuesFromRecordings);
  const cues = useMeeting((s) => s.cues);
  const error = useMeeting((s) => s.cuesError);
  const usingDemo = useMeeting((s) => s.usingDemoAudio);
  const stopListen = useMeeting((s) => s.stopListen);
  const [pos, setPos] = useState({ x: 24, y: 88 });
  const drag = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  if (!listening || mode === "silent") return null;

  const say = cues?.say?.filter(Boolean) ?? [];

  return (
    <aside
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className={cn(
        "absolute top-0 left-0 z-40 w-[min(92vw,280px)] rounded-xl p-3 shadow-window",
        "mac-blur",
        hide && "capture-hidden",
      )}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setPos({
          x: drag.current.ox + (e.clientX - drag.current.px),
          y: Math.max(32, drag.current.oy + (e.clientY - drag.current.py)),
        });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-micro font-semibold tracking-wide text-sage uppercase">
          Listening
        </p>
        <button
          type="button"
          onClick={stopListen}
          className="text-micro font-medium text-muted"
        >
          Stop listening
        </button>
      </div>
      {hide ? (
        <p className="mb-2 text-micro text-warn">
          Hidden from screen recordings — your notes, not undetectable coaching.
        </p>
      ) : null}
      {usingDemo ? (
        <p className="mb-2 text-micro text-subtle">Sample call audio</p>
      ) : null}
      <Field label="Now" value={cues?.now || "Waiting for the next beat…"} />
      <div className="mt-2">
        <p className="text-micro font-medium tracking-wide text-muted uppercase">
          Say
        </p>
        {say.length ? (
          <ul className="mt-0.5 space-y-0.5 text-sm font-medium">
            {say.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">—</p>
        )}
      </div>
      <Field label="Watch" value={cues?.watch || "—"} />
      <Field label="Parked" value={cues?.parked || "—"} />
      {error ? <p className="mt-2 text-micro text-danger">{error}</p> : null}
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <p className="text-micro font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}
