import EventKit
import Foundation

final class CalendarService {
    static let shared = CalendarService()
    private let store = EKEventStore()

    struct LoadResult {
        var authorized: Bool
        var event: MeetingEvent?
    }

    func loadNextEvent() async -> LoadResult {
        let granted = await requestAccess()
        guard granted else { return LoadResult(authorized: false, event: nil) }

        let windowEnd = Date().addingTimeInterval(60 * 60 * 36)
        let predicate = store.predicateForEvents(withStart: Date(), end: windowEnd, calendars: nil)
        let events = store.events(matching: predicate)
            .filter { !$0.isAllDay }
            .sorted { $0.startDate < $1.startDate }

        guard let first = events.first else {
            return LoadResult(authorized: true, event: nil)
        }
        return LoadResult(authorized: true, event: map(first))
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
        return MeetingEvent(
            id: event.eventIdentifier,
            title: event.title ?? "Untitled",
            start: event.startDate,
            end: event.endDate,
            conferenceURL: found?.url ?? event.url,
            conferenceLabel: found?.label
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
