import { useMeeting } from "@/lib/meeting/store";

export function NotificationStack() {
  const offer = useMeeting((s) => s.offer);
  const timeNotice = useMeeting((s) => s.timeNotice);
  const acceptOffer = useMeeting((s) => s.acceptOffer);
  const dismissOffer = useMeeting((s) => s.dismissOffer);
  const dismissTimeNotice = useMeeting((s) => s.dismissTimeNotice);
  const requestWrapUp = useMeeting((s) => s.requestWrapUp);
  const wrapBusy = useMeeting((s) => s.wrapUpBusy);

  if (!offer && !timeNotice) return null;

  return (
    <aside
      className="absolute top-11 right-3 z-50 flex w-[min(100%-1.5rem,22rem)] flex-col gap-2 sm:top-12 sm:right-4"
      role="status"
      aria-live="polite"
    >
      {offer ? (
        <div className="mac-blur stagger-in rounded-xl p-3 shadow-banner">
          <p className="text-micro font-medium tracking-wide text-muted uppercase">
            Meeting Mode
          </p>
          <p className="mt-1 text-sm font-semibold">Start Meeting Mode?</p>
          <p className="mt-0.5 text-sm text-muted">
            {offer.reason === "mic"
              ? `${offer.appName} is using the microphone.`
              : `${offer.eventTitle} starts in 5 minutes. Briefing, note, and capture will be ready.`}{" "}
            Listening never starts on its own.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={acceptOffer}
              className="min-h-10 flex-1 rounded-md bg-silver text-sm font-semibold text-silver-fg transition-transform duration-150 active:scale-[0.96]"
            >
              Start
            </button>
            <button
              type="button"
              onClick={dismissOffer}
              className="min-h-10 flex-1 rounded-md bg-elevated text-sm font-medium text-fg transition-transform duration-150 active:scale-[0.96]"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {timeNotice ? (
        <div className="mac-blur stagger-in rounded-xl p-3 shadow-banner">
          <p className="text-micro font-medium tracking-wide text-muted uppercase">
            {timeNotice.kind === "over" ? "Time is up" : "Five minutes left"}
          </p>
          <p className="mt-1 text-sm font-semibold">{timeNotice.eventTitle}</p>
          <p className="mt-0.5 text-sm text-muted">
            {timeNotice.kind === "over"
              ? "Calendar block ended. Wrap up from what you captured — the ritual stays on until you End."
              : "Check the leftover agenda, then wrap up when you hang up."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={wrapBusy}
              onClick={() => void requestWrapUp()}
              className="min-h-10 flex-1 rounded-md bg-silver text-sm font-semibold text-silver-fg disabled:opacity-50"
            >
              {wrapBusy ? "Wrapping…" : "Wrap up"}
            </button>
            <button
              type="button"
              onClick={dismissTimeNotice}
              className="min-h-10 flex-1 rounded-md bg-elevated text-sm font-medium text-fg"
            >
              Keep going
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
