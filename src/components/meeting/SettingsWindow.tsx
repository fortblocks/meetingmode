import { useState, type ReactNode } from "react";
import { formatHotkey, hotkeyFromEvent } from "@/lib/meeting/hotkey";
import { isPro, trialRemainingLabel } from "@/lib/meeting/pro";
import { useMeeting } from "@/lib/meeting/store";
import {
  FAIR_USE_MS,
  MODE_LABEL,
  NOTES_PATH,
  SETTINGS_PATH,
  type ListenMode,
} from "@/lib/meeting/types";
import { MacSwitch } from "./MacSwitch";
import { MacWindow } from "./MacWindow";

const MODES: ListenMode[] = ["internal", "sales", "standup", "silent"];

export function SettingsWindow({
  z,
  onClose,
  onFocus,
}: {
  z: number;
  onClose: () => void;
  onFocus: () => void;
}) {
  const settings = useMeeting((s) => s.settings);
  const patchSettings = useMeeting((s) => s.patchSettings);
  const setHotkey = useMeeting((s) => s.setHotkey);
  const processSample = useMeeting((s) => s.processSampleTranscript);
  const wrapUpBusy = useMeeting((s) => s.wrapUpBusy);
  const usage = useMeeting((s) => s.usage);
  const fairUseStopped = useMeeting((s) => s.fairUseStopped);
  const startTrial = useMeeting((s) => s.startTrial);
  const [recording, setRecording] = useState(false);
  const pro = isPro(settings);
  const hours = usage.streamedMs / 3_600_000;

  return (
    <MacWindow
      title="Meeting Mode Settings"
      z={z}
      onClose={onClose}
      onFocus={onFocus}
      widthClass="w-[min(92vw,520px)]"
    >
      <div className="space-y-6 px-4 py-4 text-sm">
        <Section title="General">
          <Row label="Global hotkey" hint="Default Control-Option-M">
            <button
              type="button"
              onClick={() => setRecording(true)}
              onBlur={() => setRecording(false)}
              onKeyDown={(e) => {
                if (!recording) return;
                e.preventDefault();
                const next = hotkeyFromEvent(e.nativeEvent);
                if (!next) return;
                setHotkey(next);
                setRecording(false);
              }}
              className="min-h-10 rounded-md bg-elevated px-3 font-mono text-xs text-fg"
            >
              {recording ? "Press keys…" : formatHotkey(settings.hotkey)}
            </button>
          </Row>
          <Row label="Offer when a conference starts in 5 min">
            <MacSwitch
              checked={settings.autoOfferCalendar}
              onChange={(v) => patchSettings({ autoOfferCalendar: v })}
              label="Calendar auto-offer"
            />
          </Row>
          <Row label="Offer when Zoom, Teams, FaceTime, Slack, Webex, or Discord uses the mic">
            <MacSwitch
              checked={settings.autoOfferMic}
              onChange={(v) => patchSettings({ autoOfferMic: v })}
              label="Mic auto-offer"
            />
          </Row>
        </Section>

        <Section title="Focus">
          <p className="text-muted">
            This desktop simulates Focus with a Do Not Disturb moon in the menu
            bar. On Mac, Meeting Mode uses the Focus API when the system allows
            it; otherwise DND is best-effort and may not silence every banner.
          </p>
        </Section>

        <Section title="Grok">
          <Row label="Listening mode">
            <div className="flex flex-wrap gap-1">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => patchSettings({ listenMode: mode })}
                  className={`min-h-10 rounded-md px-3 text-xs font-medium ${
                    settings.listenMode === mode
                      ? "bg-silver text-silver-fg"
                      : "bg-elevated text-muted"
                  }`}
                >
                  {MODE_LABEL[mode]}
                </button>
              ))}
            </div>
          </Row>
          <label className="block space-y-1">
            <span className="text-micro font-medium text-muted">User context</span>
            <textarea
              value={settings.userContext}
              onChange={(e) => patchSettings({ userContext: e.target.value })}
              rows={2}
              className="w-full rounded-md bg-elevated px-3 py-2 text-sm text-fg outline-none ring-silver focus:ring-1"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-micro font-medium text-muted">Agenda</span>
            <textarea
              value={settings.agenda}
              onChange={(e) => patchSettings({ agenda: e.target.value })}
              rows={2}
              className="w-full rounded-md bg-elevated px-3 py-2 text-sm text-fg outline-none ring-silver focus:ring-1"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-micro font-medium text-muted">
              xAI API key (optional override)
            </span>
            <input
              type="password"
              autoComplete="off"
              value={settings.xaiApiKey}
              onChange={(e) => patchSettings({ xaiApiKey: e.target.value })}
              placeholder="Used only if the built-in key is unavailable"
              className="h-10 w-full rounded-md bg-elevated px-3 text-sm text-fg outline-none ring-silver focus:ring-1"
            />
          </label>
        </Section>

        <Section title="Pro & trial">
          <p className="text-muted">{trialRemainingLabel(settings)}</p>
          <Row label="Unlock Pro (debug)">
            <MacSwitch
              checked={settings.unlockPro}
              onChange={(v) => patchSettings({ unlockPro: v })}
              label="Unlock Pro"
            />
          </Row>
          {!pro && !settings.trialStartedAt ? (
            <button
              type="button"
              onClick={startTrial}
              className="min-h-10 rounded-md bg-silver px-3 text-sm font-semibold text-silver-fg"
            >
              Start 7-day trial
            </button>
          ) : null}
          <Row label="Save wrap-up on Stop">
            <MacSwitch
              checked={settings.saveWrapUp}
              onChange={(v) => patchSettings({ saveWrapUp: v })}
              label="Save wrap-up"
            />
          </Row>
          <Row label="Keep recordings (default off)">
            <MacSwitch
              checked={settings.keepRecordings}
              onChange={(v) => patchSettings({ keepRecordings: v })}
              label="Keep recordings"
            />
          </Row>
          <Row
            label="Hide live panel from screen recordings"
            hint="Hides your notes. Not undetectable coaching."
          >
            <MacSwitch
              checked={settings.hideCuesFromRecordings}
              onChange={(v) => patchSettings({ hideCuesFromRecordings: v })}
              label="Hide panel from recordings"
            />
          </Row>
          <div>
            <p className="text-micro font-medium text-muted">Fair use this month</p>
            <p className="tabular-nums text-fg">
              {hours.toFixed(2)} / 20 hours
              {fairUseStopped ? " — streaming stopped" : ""}
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full bg-sage"
                style={{
                  width: `${Math.min(100, (usage.streamedMs / FAIR_USE_MS) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Section>

        <Section title="Debug">
          <button
            type="button"
            disabled={wrapUpBusy}
            onClick={() => void processSample()}
            className="min-h-10 rounded-md bg-elevated px-3 text-sm font-medium text-fg disabled:opacity-50"
          >
            {wrapUpBusy ? "Writing wrap-up…" : "Process sample transcript"}
          </button>
          <p className="text-micro text-muted">
            Runs wrap-up from a fixture call when no microphone is available.
          </p>
        </Section>

        <Section title="Privacy">
          <p className="text-muted">
            Nothing is uploaded unless Listening or wrap-up is on. Audio and
            the meeting context go to xAI; notes live in {NOTES_PATH}. Settings
            are stored as {SETTINGS_PATH}.
          </p>
        </Section>
      </div>
    </MacWindow>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-micro font-semibold tracking-wide text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm text-fg">{label}</p>
        {hint ? <p className="text-micro text-subtle">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
