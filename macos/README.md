# Meeting Mode for Mac — 0.3.0

Native menu-bar app. Open this folder in Xcode on your Mac, run it, and sit in a real call.

This environment cannot compile or sign a `.app`. You do that locally. When a build is ready, drop the zip/dmg on the download page (`/app`) as the next version.

## Open in Xcode

1. Clone [fortblocks/meetingmode](https://github.com/fortblocks/meetingmode)
2. Open `macos/MeetingMode/MeetingMode.xcodeproj`
3. Signing & Capabilities → select your Team (Personal Team is fine)
4. Product → Run (⌘R)
5. Look in the menu bar for the focus-ring extra. Shortcut: **Control-Option-M**

Requires macOS 14+ and Xcode 15+.

## What 0.3.0 does

- Menu extra + Control-Option-M
- Focus hides other apps
- Start the next calendar event, or an ad-hoc 1:1 / standup / sales / blank
- Briefing: people, leftover actions, live agenda, optional Grok prep
- Dated note at `~/Meeting Mode/` with sections for notes, actions, decisions, parked, questions
- Capture from a floating HUD or the extra (`/a` `/d` `/p` `/q`, `Alex:` owners, Friday dues)
- Open-actions inbox at `~/Meeting Mode/inbox.json`
- Elapsed timer + five-minute / overtime warning
- Wrap-up from what you captured (Grok if you paste an xAI key in Settings; otherwise an offline draft) — actions feed the inbox
- 5-minute offer before a conference
- Listening is still consent-first (live STT in a later build)

## Publish a version to the download page

1. Product → Archive
2. Distribute a Developer ID signed app (or copy `Meeting Mode.app` out of the build folder for your own machine)
3. Zip it as `MeetingMode-0.3.0.zip`
4. Add it under `public/releases/` and bump the version list in `src/components/marketing/Download.tsx`
