import EventKit
import Foundation
import AppKit

final class CalendarService {
    static let shared = CalendarService()
    private let store = EKEventStore()

    struct LoadResult {
        var authorized: Bool
        var events: [MeetingEvent]
        var denied: Bool
    }

    func loadUpcoming() async -> LoadResult {
        let granted = await requestAccess()
        if !granted {
            let denied = Self.statusDenied
            return LoadResult(authorized: false, events: [], denied: denied)
        }

        let windowEnd = Date().addingTimeInterval(60 * 60 * 36)
        let predicate = store.predicateForEvents(withStart: Date(), end: windowEnd, calendars: nil)
        let events = store.events(matching: predicate)
            .filter { !$0.isAllDay }
            .sorted { $0.startDate < $1.startDate }
            .prefix(12)
            .map(map)
        return LoadResult(authorized: true, events: Array(events), denied: false)
    }

    private static var statusDenied: Bool {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(macOS 14.0, *) {
            return status == .denied || status == .restricted
        }
        return status == .denied || status == .restricted
    }

    private func requestAccess() async -> Bool {
        if #available(macOS 14.0, *) {
            let status = EKEventStore.authorizationStatus(for: .event)
            if status == .fullAccess { return true }
            if status == .denied || status == .restricted { return false }
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
        let source = event.calendar?.source.title ?? event.calendar?.title ?? ""
        return MeetingEvent(
            id: event.eventIdentifier,
            title: event.title ?? "Untitled",
            start: event.startDate,
            end: event.endDate,
            conferenceURL: found?.url ?? event.url,
            conferenceLabel: found?.label,
            attendees: attendees,
            notes: event.notes,
            agenda: agenda,
            calendarName: source
        )
    }

    static func conference(in text: String) -> (url: URL, label: String)? {
        let patterns: [(String, String)] = [
            (#"https://meet\.google\.com/[^\s<>"']+"#, "Meet"),
            (#"https://calendar\.google\.com/[^\s<>"']+"#, "Calendar"),
            (#"https://[\w.-]*zoom\.us/(?:j|my)/[^\s<>"']+"#, "Zoom"),
            (#"https://teams\.microsoft\.com/[^\s<>"']+"#, "Teams"),
            (#"https://[\w.-]*webex\.com/[^\s<>"']+"#, "Webex"),
        ]
        for (pattern, label) in patterns {
            if let match = text.range(of: pattern, options: .regularExpression) {
                let raw = String(text[match]).trimmingCharacters(in: .punctuationCharacters)
                if let url = URL(string: raw) { return (url, label) }
            }
        }
        return nil
    }

    func loadIcs(_ rawUrl: String) async -> [MeetingEvent] {
        let trimmed = rawUrl.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "webcal:", with: "https:", options: .caseInsensitive)
        guard let url = URL(string: trimmed), url.scheme == "https",
              Self.allowedIcsHost(url.host ?? "") else { return [] }
        do {
            var req = URLRequest(url: url, timeoutInterval: 12)
            req.setValue("text/calendar, text/plain, */*", forHTTPHeaderField: "Accept")
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let text = String(data: data, encoding: .utf8) else { return [] }
            return Self.parseIcs(text)
        } catch {
            return []
        }
    }

    static func allowedIcsHost(_ host: String) -> Bool {
        let h = host.lowercased()
        return h == "calendar.google.com"
            || h == "calendar.googleusercontent.com"
            || h == "www.google.com"
    }

    static func merge(_ local: [MeetingEvent], _ remote: [MeetingEvent]) -> [MeetingEvent] {
        var seen = Set(local.map { "\($0.title.lowercased())|\(Int($0.start.timeIntervalSince1970))" })
        var out = local
        for ev in remote {
            let key = "\(ev.title.lowercased())|\(Int(ev.start.timeIntervalSince1970))"
            if seen.insert(key).inserted {
                out.append(ev)
            }
        }
        return out.sorted { $0.start < $1.start }
    }

    static func parseIcs(_ raw: String) -> [MeetingEvent] {
        let unfolded = raw.replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\n ", with: "")
            .replacingOccurrences(of: "\n\t", with: "")
        let blocks = unfolded.components(separatedBy: "BEGIN:VEVENT").dropFirst()
        let now = Date()
        let horizon = now.addingTimeInterval(36 * 60 * 60)
        var events: [MeetingEvent] = []
        for block in blocks {
            let body = block.components(separatedBy: "END:VEVENT").first ?? ""
            let lines = body.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }
            func value(_ key: String) -> String {
                guard let line = lines.first(where: { $0.uppercased().hasPrefix(key) }) else { return "" }
                if let idx = line.firstIndex(of: ":") {
                    return unescape(String(line[line.index(after: idx)...]))
                }
                return ""
            }
            guard let start = parseIcsDate(lines.first { $0.uppercased().hasPrefix("DTSTART") } ?? ""),
                  let end = parseIcsDate(lines.first { $0.uppercased().hasPrefix("DTEND") } ?? ""),
                  end > now, start <= horizon else { continue }
            let title = value("SUMMARY:")
            let location = value("LOCATION:")
            let notes = value("DESCRIPTION:")
            let urlStr = value("URL:")
            let blob = [location, notes, urlStr].joined(separator: "\n")
            let found = conference(in: blob)
            let attendees = lines.filter { $0.uppercased().hasPrefix("ATTENDEE") }.compactMap { line -> String? in
                if let cn = line.range(of: "CN=", options: .caseInsensitive) {
                    let rest = line[cn.upperBound...]
                    let name = rest.split(separator: ";").first?.split(separator: ":").first ?? ""
                    let s = String(name).replacingOccurrences(of: "\"", with: "")
                    return s.isEmpty ? nil : s
                }
                return nil
            }
            let agenda = notes.split(separator: "\n").map(String.init)
                .filter { $0.hasPrefix("-") || $0.hasPrefix("*") }
                .map { $0.replacingOccurrences(of: #"^[-*]\s*"#, with: "", options: .regularExpression) }
            events.append(
                MeetingEvent(
                    id: value("UID:").isEmpty ? "ics-\(start.timeIntervalSince1970)" : value("UID:"),
                    title: title.isEmpty ? "Untitled" : title,
                    start: start,
                    end: end,
                    conferenceURL: found?.url ?? URL(string: urlStr),
                    conferenceLabel: found?.label,
                    attendees: attendees,
                    notes: notes.isEmpty ? nil : notes,
                    agenda: agenda,
                    calendarName: "Google"
                )
            )
        }
        return events.sorted { $0.start < $1.start }
    }

    private static func unescape(_ value: String) -> String {
        value.replacingOccurrences(of: "\\n", with: "\n")
            .replacingOccurrences(of: "\\,", with: ",")
            .replacingOccurrences(of: "\\;", with: ";")
            .replacingOccurrences(of: "\\\\", with: "\\")
    }

    private static func parseIcsDate(_ line: String) -> Date? {
        let value = line.split(separator: ":").last.map(String.init) ?? ""
        let compact = value.replacingOccurrences(of: "-", with: "")
        guard compact.count >= 15 else { return nil }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        if compact.hasSuffix("Z") {
            formatter.dateFormat = "yyyyMMdd'T'HHmmss'Z'"
            formatter.timeZone = TimeZone(secondsFromGMT: 0)
        } else {
            formatter.dateFormat = "yyyyMMdd'T'HHmmss"
            formatter.timeZone = TimeZone.current
        }
        return formatter.date(from: String(compact.prefix(16)))
            ?? formatter.date(from: String(compact.prefix(15)))
    }

    static func openGoogleCalendar() {
        if let url = URL(string: "https://calendar.google.com") {
            NSWorkspace.shared.open(url)
        }
    }

    static func openInternetAccounts() {
        let candidates = [
            "x-apple.systempreferences:com.apple.Internet-Accounts-Settings.extension",
            "x-apple.systempreferences:com.apple.preferences.internetaccounts",
        ]
        for s in candidates {
            if let url = URL(string: s), NSWorkspace.shared.open(url) { return }
        }
        openGoogleCalendar()
    }

    static func openCalendarPrivacy() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars") {
            NSWorkspace.shared.open(url)
        }
    }
}
