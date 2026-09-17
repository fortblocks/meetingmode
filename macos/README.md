# Meeting Mode for Mac — 0.1.0

Native menu-bar app. Open this folder in Xcode on your Mac, run it, and test as a real user.

This environment cannot compile or sign a `.app`. You do that locally. When a build is ready, drop the zip/dmg on the download page (`/app`) as the next version.

## Open in Xcode

1. Clone [fortblocks/meetingmode](https://github.com/fortblocks/meetingmode)
2. Open `macos/MeetingMode/MeetingMode.xcodeproj`
3. Signing & Capabilities → select your Team (Personal Team is fine)
4. Product → Run (⌘R)
5. Look in the menu bar for the focus-ring extra. Shortcut: **Control-Option-M**

Requires macOS 14+ and Xcode 15+.

## What 0.1.0 does

- Menu extra + Control-Option-M
- Focus hides other apps
- Dated note at `~/Meeting Mode/YYYY-MM-DD.md`
- Next Calendar event + Join when a Meet/Zoom/Teams/Webex link is on the event
- Listening is a consent sheet only (cues + wrap-up in 0.2)

## Publish a version to the download page

1. Product → Archive
2. Distribute a Developer ID signed app (or copy `Meeting Mode.app` out of the build folder for your own machine)
3. Zip it as `MeetingMode-0.2.0.zip`
4. Add it under `public/releases/` and bump the version list in `src/components/marketing/Download.tsx`
