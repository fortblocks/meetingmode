# Meeting Mode

A local menu-bar ritual for calls: **Focus**, a dated note, **Join** from calendar, capture as you go, wrap-up, and optional Grok listening.

Live: [meetingmode.xyz](https://meetingmode.xyz)

- Marketing at [`/`](https://meetingmode.xyz)
- Download the Mac app at [`/app`](https://meetingmode.xyz/app)
- In-browser desktop at [`/preview`](https://meetingmode.xyz/preview)
- Native Xcode project: [`macos/MeetingMode/MeetingMode.xcodeproj`](macos/MeetingMode/MeetingMode.xcodeproj)

## Test the ritual (browser)

1. Open [meetingmode.xyz/preview](https://meetingmode.xyz/preview)
2. Click the menu extra or press Control-Option-M
3. Start the next calendar event, or a 1:1 / standup / sales call
4. Check the agenda, capture `/a Alex: send usage Friday`, mark leftover actions
5. Wrap up — uses what you wrote. Actions land in the inbox.

## Test as a real user (Mac)

1. Download the [source zip](https://github.com/fortblocks/meetingmode/archive/refs/heads/main.zip) from [meetingmode.xyz/app](https://meetingmode.xyz/app)
2. Open `macos/MeetingMode/MeetingMode.xcodeproj` in Xcode 15+
3. Signing & Capabilities → your Team
4. Product → Run (⌘R)
5. Menu bar extra. Shortcut: **Control-Option-M**

## Stack

TanStack Start, React, Tailwind for the site. Native app is Swift + SwiftUI + EventKit. No accounts. Notes stay on the machine.
