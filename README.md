# Meeting Mode

A local menu-bar ritual for calls: **Focus**, a dated note, **Join** from calendar, and optional Grok listening.

Live: [meetingmode.xyz](https://meetingmode.xyz)

- Marketing at [`/`](https://meetingmode.xyz)
- Download the Mac app at [`/app`](https://meetingmode.xyz/app)
- In-browser desktop preview at [`/preview`](https://meetingmode.xyz/preview)
- Native Xcode project: [`macos/MeetingMode/MeetingMode.xcodeproj`](macos/MeetingMode/MeetingMode.xcodeproj)

## Test as a real user (Mac)

This sandbox cannot sign a `.app`. You compile 0.1.0 locally:

1. Download the [source zip](https://github.com/fortblocks/meetingmode/archive/refs/heads/main.zip) from [meetingmode.xyz/app](https://meetingmode.xyz/app), or clone this repo
2. Open `macos/MeetingMode/MeetingMode.xcodeproj` in Xcode 15+
3. Signing & Capabilities → your Team (Personal Team is fine)
4. Product → Run (⌘R)
5. Look in the **menu bar** for the focus-ring extra. Shortcut: **Control-Option-M**

Notes write to `~/Meeting Mode/YYYY-MM-DD.md`. Calendar Join needs Calendar permission. Listening is a consent sheet only in 0.1.0 — wrap-up and live cues land in the next signed version on `/app`.

## Publish a version to the download page

1. Product → Archive, then zip `Meeting Mode.app` as `MeetingMode-0.2.0.zip`
2. Add the zip under `public/releases/`
3. Add a row in `src/components/marketing/Download.tsx`

## Stack

TanStack Start, React, Tailwind for the site. Native app is Swift + SwiftUI + EventKit. No accounts. Preferences and notes stay on the machine.

Wrap-up and live cues in the browser preview need `XAI_API_KEY` on the Vercel project and `VITE_AUTH_ENABLED=false`.
