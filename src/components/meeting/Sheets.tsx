import { useMeeting } from "@/lib/meeting/store";

export function ConsentSheet() {
  const open = useMeeting((s) => s.consentOpen);
  const confirm = useMeeting((s) => s.confirmListen);
  const decline = useMeeting((s) => s.declineListen);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-ink/50 px-4">
      <div
        role="dialog"
        aria-labelledby="consent-title"
        className="w-[min(100%,28rem)] rounded-xl bg-ink-soft p-5 shadow-window"
      >
        <h2 id="consent-title" className="text-lg font-semibold tracking-tight">
          Start listening?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Meeting Mode will send call audio to xAI to transcribe and suggest
          talking points. You are responsible for telling other participants if
          required.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={confirm}
            className="min-h-11 flex-1 rounded-md bg-silver text-sm font-semibold text-silver-fg"
          >
            Start listening
          </button>
          <button
            type="button"
            onClick={decline}
            className="min-h-11 flex-1 rounded-md bg-elevated text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrialSheet() {
  const open = useMeeting((s) => s.trialOpen);
  const startTrial = useMeeting((s) => s.startTrial);
  const dismiss = useMeeting((s) => s.dismissTrial);
  const unlock = useMeeting((s) => s.patchSettings);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-ink/50 px-4">
      <div
        role="dialog"
        aria-labelledby="trial-title"
        className="w-[min(100%,28rem)] rounded-xl bg-ink-soft p-5 shadow-window"
      >
        <h2 id="trial-title" className="text-lg font-semibold tracking-tight">
          Listening is a Pro feature
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Live transcription and suggestion cards need an active trial or Pro.
          Nothing is streamed until then.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={startTrial}
            className="min-h-11 rounded-md bg-silver text-sm font-semibold text-silver-fg"
          >
            Start 7-day trial
          </button>
          <button
            type="button"
            onClick={() => {
              unlock({ unlockPro: true });
              dismiss();
            }}
            className="min-h-11 rounded-md bg-elevated text-sm font-medium"
          >
            Unlock Pro (debug)
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 text-sm text-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
