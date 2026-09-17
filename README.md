# Meeting Mode

A local menu-bar ritual for calls: **Focus**, a dated note, **Join** from calendar, and optional Grok listening.

Live: [meetingmode.xyz](https://meetingmode.xyz)

This is an in-browser macOS desktop of the native Meeting Mode product — status item, settings, notes, wrap-up, and live cues.

## Try it

1. Open [meetingmode.xyz](https://meetingmode.xyz)
2. Click **Meeting Mode** in the menu bar (or press Control-Option-M / Ctrl+Alt+M)
3. Flip **On** when a meeting is about to start
4. Use **Join** on the calendar offer, then **Listening** after the consent sheet if you want wrap-up and live cues

Wrap-up and live cues need an xAI API key. Set `XAI_API_KEY` on the Vercel project (Production).

## Deploy

Import [fortblocks/meetingmode](https://github.com/fortblocks/meetingmode) into the Vercel team, then:

1. Turn **Deployment Protection** off so the public site is not behind Vercel login
2. Add the domain `meetingmode.xyz` (and `www` if you want it)
3. Set env `XAI_API_KEY` and `VITE_AUTH_ENABLED=false`

## Stack

TanStack Start, React, Tailwind. No accounts. Preferences and notes stay in the browser.
