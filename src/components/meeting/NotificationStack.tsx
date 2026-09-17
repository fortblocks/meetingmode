import { useMeeting } from "@/lib/meeting/store";

export function NotificationStack() {
  const offer = useMeeting((s) => s.offer);
  const acceptOffer = useMeeting((s) => s.acceptOffer);
  const dismissOffer = useMeeting((s) => s.dismissOffer);
  if (!offer) return null;

  const body =
    offer.reason === "mic"
      ? `${offer.appName} is using the microphone.`
      : `${offer.eventTitle} starts in 5 minutes.`;

  return (
    <aside
      className="absolute top-11 right-3 z-50 w-[min(100%-1.5rem,22rem)] sm:top-12 sm:right-4"
      role="status"
      aria-live="polite"
    >
      <div className="mac-blur stagger-in rounded-xl p-3 shadow-banner">
        <p className="text-micro font-medium tracking-wide text-muted uppercase">
          Meeting Mode
        </p>
        <p className="mt-1 text-sm font-semibold">Start Meeting Mode?</p>
        <p className="mt-0.5 text-sm text-muted">{body} Listening never starts on its own.</p>
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
    </aside>
  );
}
