import { TRIAL_MS, type Settings } from "./types";

export function isPro(settings: Settings, now = Date.now()) {
  if (settings.unlockPro) return true;
  if (!settings.trialStartedAt) return false;
  const start = new Date(settings.trialStartedAt).getTime();
  if (Number.isNaN(start)) return false;
  return now - start < TRIAL_MS;
}

export function trialRemainingLabel(settings: Settings, now = Date.now()) {
  if (settings.unlockPro) return "Pro unlocked";
  if (!settings.trialStartedAt) return "No trial started";
  const start = new Date(settings.trialStartedAt).getTime();
  const left = TRIAL_MS - (now - start);
  if (left <= 0) return "Trial ended";
  const days = Math.ceil(left / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"} left in trial`;
}
