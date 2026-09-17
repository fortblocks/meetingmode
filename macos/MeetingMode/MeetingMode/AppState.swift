import AppKit
import Combine
import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var isOn = false
    @Published var listening = false
    @Published var nextEvent: MeetingEvent?
    @Published var currentNoteURL: URL?
    @Published var listenHint: String?
    @Published var calendarAuthorized = false

    let version = "0.1.0"
    private var settingsWindow: NSWindow?

    func start() {
        NotesService.shared.ensureFolder()
        Task { await refreshCalendar() }
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.refreshCalendar()
            }
        }
    }

    func toggleFocus() {
        isOn.toggle()
        if isOn {
            FocusService.start()
            currentNoteURL = NotesService.shared.openOrCreateToday()
            listenHint = nil
        } else {
            if listening { stopListening() }
            FocusService.stop()
        }
    }

    func openJoin() {
        guard let url = nextEvent?.conferenceURL else { return }
        NSWorkspace.shared.open(url)
    }

    func openNote() {
        let url = currentNoteURL ?? NotesService.shared.openOrCreateToday()
        currentNoteURL = url
        NSWorkspace.shared.open(url)
    }

    func requestListening() {
        let alert = NSAlert()
        alert.messageText = "Start listening?"
        alert.informativeText = "Listening never starts on its own. This 0.1.0 build records the intent only — wrap-up and live cues land in the next signed build."
        alert.addButton(withTitle: "Start")
        alert.addButton(withTitle: "Not now")
        if alert.runModal() == .alertFirstButtonReturn {
            listening = true
            listenHint = "Listening is armed. Cues and wrap-up ship in 0.2."
        }
    }

    func stopListening() {
        listening = false
        listenHint = nil
    }

    func refreshCalendar() async {
        let result = await CalendarService.shared.loadNextEvent()
        calendarAuthorized = result.authorized
        nextEvent = result.event
    }

    func openSettings() {
        if settingsWindow == nil {
            let view = SettingsView().environmentObject(self)
            let hosting = NSHostingController(rootView: view)
            let window = NSWindow(contentViewController: hosting)
            window.title = "Meeting Mode Settings"
            window.styleMask = [.titled, .closable]
            window.setContentSize(NSSize(width: 420, height: 360))
            window.isReleasedWhenClosed = false
            settingsWindow = window
        }
        settingsWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func quit() {
        if isOn { FocusService.stop() }
        NSApp.terminate(nil)
    }
}

struct MeetingEvent: Identifiable {
    let id: String
    let title: String
    let start: Date
    let end: Date
    let conferenceURL: URL?
    let conferenceLabel: String?

    var rangeLabel: String {
        let f = DateFormatter()
        f.timeStyle = .short
        return "\(f.string(from: start)) – \(f.string(from: end))"
    }

    var relativeLabel: String {
        let mins = Int((start.timeIntervalSinceNow / 60).rounded())
        if mins <= 0 { return "now" }
        if mins < 60 { return "in \(mins) min" }
        return "in \(mins / 60) hr"
    }
}
