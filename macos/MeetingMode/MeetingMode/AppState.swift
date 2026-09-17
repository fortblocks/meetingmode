import AppKit
import Combine
import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var isOn = false
    @Published var listening = false
    @Published var events: [MeetingEvent] = []
    @Published var activeEventID: String?
    @Published var currentNoteURL: URL?
    @Published var noteContent = ""
    @Published var listenHint: String?
    @Published var calendarAuthorized = false
    @Published var captures: [Capture] = []
    @Published var captureKind: Capture.Kind = .note
    @Published var sessionStartedAt: Date?
    @Published var elapsedLabel = "0:00"
    @Published var wrapUp: WrapUp?
    @Published var wrapBusy = false
    @Published var apiKey = Prefs.apiKey
    @Published var agenda = Prefs.agenda
    @Published var userContext = Prefs.userContext
    @Published var autoOfferCalendar = Prefs.autoOfferCalendar
    @Published var saveWrapUp = Prefs.saveWrapUp
    @Published var warnBeforeEnd = Prefs.warnBeforeEnd
    @Published var sessionTitle = "Meeting"
    @Published var agendaItems: [AgendaItem] = []
    @Published var inbox: [InboxItem] = []
    @Published var timeWarn: String?

    let version = "0.3.0"
    private var settingsWindow: NSWindow?
    private var noteWindow: NSWindow?
    private var briefingWindow: NSWindow?
    private var wrapWindow: NSWindow?
    private var inboxWindow: NSWindow?
    private var hud: SessionHUDController?
    private var ticker: Timer?
    private var offeredEventID: String?

    var activeEvent: MeetingEvent? {
        events.first { $0.id == activeEventID }
    }

    func start() {
        NotesService.shared.ensureFolder()
        hud = SessionHUDController(state: self)
        Task { await refreshCalendar() }
        ticker = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
            }
        }
        NotificationService.shared.request()
        inbox = NotesService.shared.loadInbox()
        if inbox.isEmpty {
            inbox = NotesService.shared.seedInbox()
        }
    }

    private var lastCalRefresh = Date.distantPast

    func tick() {
        if isOn, let start = sessionStartedAt {
            elapsedLabel = Self.elapsed(from: start)
            hud?.setVisible(true)
            if warnBeforeEnd, let ev = events.first(where: { $0.id == activeEventID }) {
                let left = ev.end.timeIntervalSinceNow
                if left <= 0, timeWarn != "over" {
                    timeWarn = "over"
                    listenHint = "Calendar time is over — wrap up when you are ready."
                    NotificationService.shared.ending(title: ev.title, over: true)
                } else if left > 0, left <= 5 * 60, timeWarn == nil {
                    timeWarn = "five"
                    listenHint = "Five minutes left."
                    NotificationService.shared.ending(title: ev.title, over: false)
                }
            }
        } else {
            hud?.setVisible(false)
        }
        if Date().timeIntervalSince(lastCalRefresh) > 30 {
            lastCalRefresh = Date()
            Task { await refreshCalendar() }
            maybeOffer()
        }
        NotificationCenter.default.post(name: .init("MeetingMode.Tick"), object: nil)
    }

    func refreshCalendar() async {
        let result = await CalendarService.shared.loadUpcoming()
        calendarAuthorized = result.authorized
        events = result.events
        if activeEventID == nil { activeEventID = events.first?.id }
    }

    func toggleFocus() {
        if isOn { stopMode() } else { startMode() }
    }

    func startMode(eventID: String? = nil, template: MeetingTemplate? = nil) {
        if isOn {
            return
        }
        let ev = template == nil ? (events.first { $0.id == eventID } ?? events.first) : nil
        activeEventID = ev?.id
        let title = template?.title ?? ev?.title ?? "Meeting"
        sessionTitle = title
        let agendaLines = template?.agenda ?? ev?.agenda ?? []
        agendaItems = agendaLines.enumerated().map {
            AgendaItem(id: "ag-\($0.offset)", text: $0.element, done: false)
        }
        timeWarn = nil
        let url = NotesService.shared.createSessionNote(
            title: title,
            event: ev,
            talkingPoints: agenda,
            extraAgenda: agendaLines
        )
        currentNoteURL = url
        noteContent = NotesService.shared.read(url)
        captures = []
        wrapUp = nil
        listenHint = nil
        isOn = true
        sessionStartedAt = Date()
        elapsedLabel = "0:00"
        FocusService.start()
        openBriefing()
        NotificationCenter.default.post(name: .init("MeetingMode.FocusChanged"), object: nil)
    }

    func stopMode() {
        if listening { stopListening() }
        let shouldWrap = saveWrapUp && currentNoteURL != nil && (!captures.isEmpty)
        isOn = false
        sessionStartedAt = nil
        timeWarn = nil
        FocusService.stop()
        NotificationCenter.default.post(name: .init("MeetingMode.FocusChanged"), object: nil)
        if shouldWrap {
            Task { await requestWrapUp() }
        }
    }

    func openJoin() {
        guard let url = activeEvent?.conferenceURL else { return }
        NSWorkspace.shared.open(url)
    }

    func openNote() {
        openNoteEditor()
    }

    func capture(_ raw: String) {
        guard let parsed = Capture.parse(raw, fallback: captureKind) else { return }
        if !isOn { startMode() }
        guard let url = currentNoteURL else { return }
        let item = Capture(id: UUID().uuidString, kind: parsed.0, text: parsed.1, at: Date(), owner: parsed.2, due: parsed.3)
        captures.append(item)
        var line = parsed.1
        if parsed.0 == .action {
            if !parsed.2.isEmpty { line = "\(parsed.2): \(parsed.1)" }
            if !parsed.3.isEmpty { line += " (due \(parsed.3))" }
            upsertInbox(text: parsed.1, owner: parsed.2.isEmpty ? "Unassigned" : parsed.2, due: parsed.3)
        }
        NotesService.shared.appendCapture(to: url, kind: parsed.0, text: line)
        noteContent = NotesService.shared.read(url)
        listenHint = nil
    }

    func requestListening() {
        let alert = NSAlert()
        alert.messageText = "Start listening?"
        alert.informativeText = "Listening never starts on its own. Audio would go to xAI for cues and wrap-up. 0.3.0 records consent and uses your captures either way — live STT lands in the next signed build."
        alert.addButton(withTitle: "Start")
        alert.addButton(withTitle: "Not now")
        if alert.runModal() == .alertFirstButtonReturn {
            listening = true
            listenHint = "Listening is armed. Capture still works from the HUD. Live STT is next."
        }
    }

    func stopListening() {
        listening = false
        listenHint = nil
    }

    func requestWrapUp() async {
        guard let url = currentNoteURL else { return }
        wrapBusy = true
        let title = sessionTitle
        let notes = NotesService.shared.read(url)
        let transcript = captures.map { "\($0.kind.label): \($0.text)" }.joined(separator: "\n")
        let result = await GrokService.wrapUp(
            title: title,
            notes: notes,
            transcript: transcript.isEmpty ? notes : transcript,
            key: apiKey
        )
        wrapUp = result
        wrapBusy = false
        NotesService.shared.writeSummary(beside: url, title: title, wrap: result)
        for line in result.actions where !line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            upsertInbox(text: line, owner: "Unassigned", due: "")
        }
        openWrapUp()
    }

    func savePrefs() {
        Prefs.apiKey = apiKey
        Prefs.agenda = agenda
        Prefs.userContext = userContext
        Prefs.autoOfferCalendar = autoOfferCalendar
        Prefs.saveWrapUp = saveWrapUp
        Prefs.warnBeforeEnd = warnBeforeEnd
    }

    func openSettings() {
        settingsWindow = present(settingsWindow, title: "Meeting Mode Settings", size: NSSize(width: 440, height: 520)) {
            SettingsView().environmentObject(self)
        }
    }

    func openNoteEditor() {
        if let url = currentNoteURL {
            noteContent = NotesService.shared.read(url)
        }
        noteWindow = present(noteWindow, title: "Meeting note", size: NSSize(width: 560, height: 520)) {
            NoteEditorView().environmentObject(self)
        }
    }

    func openBriefing() {
        briefingWindow = present(briefingWindow, title: "Briefing", size: NSSize(width: 440, height: 520)) {
            BriefingView().environmentObject(self)
        }
    }

    func openWrapUp() {
        wrapWindow = present(wrapWindow, title: "Wrap-up", size: NSSize(width: 480, height: 520)) {
            WrapUpView().environmentObject(self)
        }
    }

    func openInbox() {
        inboxWindow = present(inboxWindow, title: "Open actions", size: NSSize(width: 420, height: 460)) {
            InboxView().environmentObject(self)
        }
    }

    func toggleAgenda(_ id: String) {
        if let i = agendaItems.firstIndex(where: { $0.id == id }) {
            agendaItems[i].done.toggle()
        }
    }

    func toggleInbox(_ id: String) {
        if let i = inbox.firstIndex(where: { $0.id == id }) {
            inbox[i].done.toggle()
            NotesService.shared.saveInbox(inbox)
        }
    }

    private func upsertInbox(text: String, owner: String, due: String) {
        let key = "\(owner.lowercased())::\(text.lowercased())"
        if inbox.contains(where: { "\($0.owner.lowercased())::\($0.text.lowercased())" == key }) {
            return
        }
        inbox.insert(
            InboxItem(
                id: UUID().uuidString,
                text: text,
                owner: owner,
                due: due,
                done: false,
                createdAt: Date(),
                meetingTitle: sessionTitle
            ),
            at: 0
        )
        NotesService.shared.saveInbox(inbox)
    }

    func quit() {
        if isOn { FocusService.stop() }
        NSApp.terminate(nil)
    }

    private func maybeOffer() {
        guard autoOfferCalendar, !isOn else { return }
        guard let ev = events.first, ev.conferenceURL != nil else { return }
        let mins = ev.start.timeIntervalSinceNow / 60
        guard mins > 0, mins <= 5, offeredEventID != ev.id else { return }
        offeredEventID = ev.id
        NotificationService.shared.offer(event: ev)
    }

    private func present<V: View>(_ existing: NSWindow?, title: String, size: NSSize, @ViewBuilder view: () -> V) -> NSWindow {
        if let existing {
            existing.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return existing
        }
        let hosting = NSHostingController(rootView: view())
        let window = NSWindow(contentViewController: hosting)
        window.title = title
        window.styleMask = [.titled, .closable, .resizable]
        window.setContentSize(size)
        window.isReleasedWhenClosed = false
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        return window
    }

    static func elapsed(from start: Date) -> String {
        let total = max(0, Int(Date().timeIntervalSince(start)))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        return String(format: "%d:%02d", m, s)
    }
}

struct MeetingEvent: Identifiable {
    let id: String
    let title: String
    let start: Date
    let end: Date
    let conferenceURL: URL?
    let conferenceLabel: String?
    var attendees: [String] = []
    var notes: String?
    var agenda: [String] = []

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

    var remainingLabel: String {
        let mins = Int((end.timeIntervalSinceNow / 60).rounded())
        if mins <= 0 { return "over" }
        if mins < 60 { return "\(mins) min left" }
        return "\(mins / 60)h left"
    }
}
