import EventKit
import Foundation

final class CalendarService {
    static let shared = CalendarService()
    private let store = EKEventStore()

    struct LoadResult {
        var authorized: Bool
        var events: [MeetingEvent]
    }

    func loadUpcoming() async -> LoadResult {
        let granted = await requestAccess()
        guard granted else { return LoadResult(authorized: false, events: []) }

        let windowEnd = Date().addingTimeInterval(60 * 60 * 36)
        let predicate = store.predicateForEvents(withStart: Date(), end: windowEnd, calendars: nil)
        let events = store.events(matching: predicate)
            .filter { !$0.isAllDay }
            .sorted { $0.startDate < $1.startDate }
            .prefix(8)
            .map(map)
        return LoadResult(authorized: true, events: Array(events))
    }

    private func requestAccess() async -> Bool {
        if #available(macOS 14.0, *) {
            let status = EKEventStore.authorizationStatus(for: .event)
            if status == .fullAccess { return true }
            return (try? await store.requestFullAccessToEvents()) ?? false
        } else {
            return await withCheckedContinuation { cont in
                store.requestAccess(to: .event) { ok, _ in cont.resume(returning: ok) }
            }
        }
    }

    private func map(_ event: EKEvent) -> MeetingEvent {
        let text = [event.location, event.notes, event.url?.absoluteString]
            .compactMap { $0 }
            .joined(separator: "\n")
        let found = Self.conference(in: text)
        let attendees = (event.attendees ?? [])
            .compactMap { $0.name }
            .filter { !$0.isEmpty }
        let agenda = (event.notes ?? "")
            .split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.hasPrefix("-") || $0.hasPrefix("*") }
            .map { $0.replacingOccurrences(of: #"^[-*]\s*"#, with: "", options: .regularExpression) }
        return MeetingEvent(
            id: event.eventIdentifier,
            title: event.title ?? "Untitled",
            start: event.startDate,
            end: event.endDate,
            conferenceURL: found?.url ?? event.url,
            conferenceLabel: found?.label,
            attendees: attendees,
            notes: event.notes,
            agenda: agenda
        )
    }

    static func conference(in text: String) -> (url: URL, label: String)? {
        let patterns: [(String, String)] = [
            (#"https://meet\.google\.com/[^\s]+"#, "Meet"),
            (#"https://[\w.-]*zoom\.us/j/[^\s]+"#, "Zoom"),
            (#"https://teams\.microsoft\.com/[^\s]+"#, "Teams"),
            (#"https://[\w.-]*webex\.com/[^\s]+"#, "Webex"),
        ]
        for (pattern, label) in patterns {
            if let match = text.range(of: pattern, options: .regularExpression) {
                let raw = String(text[match]).trimmingCharacters(in: .punctuationCharacters)
                if let url = URL(string: raw) { return (url, label) }
            }
        }
        return nil
    }
}
