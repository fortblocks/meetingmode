import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MacWindow({
  title,
  z,
  onClose,
  onFocus,
  children,
  widthClass,
  paper,
  className,
}: {
  title: string;
  z: number;
  onClose: () => void;
  onFocus: () => void;
  children: ReactNode;
  widthClass?: string;
  paper?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: 24, y: 48 });
  const drag = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.offsetParent as HTMLElement | null;
    const pw = parent?.clientWidth ?? window.innerWidth;
    const drift = (title.length % 7) * 18;
    setPos({
      x: Math.max(12, Math.min(pw - 80, pw * 0.38 - el.offsetWidth / 4 + drift)),
      y: Math.max(40, 52 + (title.length % 4) * 12),
    });
  }, [title]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onFocus();
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: drag.current.ox + (e.clientX - drag.current.px),
      y: Math.max(28, drag.current.oy + (e.clientY - drag.current.py)),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={title}
      onMouseDown={onFocus}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, zIndex: z }}
      className={cn(
        "absolute top-0 left-0 flex max-h-[min(78vh,640px)] w-[min(92vw,440px)] flex-col overflow-hidden rounded-xl shadow-window",
        paper ? "bg-paper text-paper-fg" : "bg-ink-soft text-fg",
        widthClass,
        className,
      )}
    >
      <header
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          "flex h-11 shrink-0 cursor-grab items-center gap-3 px-3 active:cursor-grabbing",
          paper ? "bg-paper" : "bg-elevated",
        )}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="relative size-3 rounded-full bg-close after:absolute after:-inset-2 after:content-['']"
          />
          <span className="size-3 rounded-full bg-min" />
          <span className="size-3 rounded-full bg-zoom" />
        </div>
        <p
          className={cn(
            "flex-1 text-center text-sm font-medium tracking-tight",
            paper ? "text-paper-fg" : "text-fg",
          )}
        >
          {title}
        </p>
        <span className="w-10" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}
