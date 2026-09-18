import Foundation

enum Prefs {
    private static let d = UserDefaults.standard

    static var apiKey: String {
        get { d.string(forKey: "xaiApiKey") ?? "" }
        set { d.set(newValue, forKey: "xaiApiKey") }
    }

    static var agenda: String {
        get { d.string(forKey: "agenda") ?? "Pipeline, Acme renewal, staffing for Q4." }
        set { d.set(newValue, forKey: "agenda") }
    }

    static var userContext: String {
        get { d.string(forKey: "userContext") ?? "Staff engineer at a 40-person B2B product team." }
        set { d.set(newValue, forKey: "userContext") }
    }

    static var autoOfferCalendar: Bool {
        get { d.object(forKey: "autoOfferCalendar") as? Bool ?? true }
        set { d.set(newValue, forKey: "autoOfferCalendar") }
    }

    static var saveWrapUp: Bool {
        get { d.object(forKey: "saveWrapUp") as? Bool ?? true }
        set { d.set(newValue, forKey: "saveWrapUp") }
    }

    static var warnBeforeEnd: Bool {
        get { d.object(forKey: "warnBeforeEnd") as? Bool ?? true }
        set { d.set(newValue, forKey: "warnBeforeEnd") }
    }

    static var icsUrl: String {
        get { d.string(forKey: "googleIcsUrl") ?? "" }
        set { d.set(newValue, forKey: "googleIcsUrl") }
    }
}

struct Capture: Identifiable, Equatable {
    let id: String
    let kind: Kind
    let text: String
    let at: Date
    var owner: String = ""
    var due: String = ""

    enum Kind: String, CaseIterable, Identifiable {
        case note, action, decision, parked, question
        var id: String { rawValue }
        var heading: String {
            switch self {
            case .note: return "Notes"
            case .action: return "Actions"
            case .decision: return "Decisions"
            case .parked: return "Parked"
            case .question: return "Open questions"
            }
        }
        var label: String {
            String(rawValue.prefix(1)).uppercased() + String(rawValue.dropFirst())
        }
    }

    static func parse(_ raw: String, fallback: Kind) -> (Kind, String, String, String)? {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return nil }
        var kind = fallback
        var rest = t
        if t.hasPrefix("/"), t.count > 2 {
            let tag = String(t.dropFirst().prefix(1)).lowercased()
            let body = t.dropFirst(2).trimmingCharacters(in: .whitespaces)
            let map: [String: Kind] = [
                "a": .action, "d": .decision, "p": .parked, "q": .question, "n": .note,
            ]
            if let k = map[tag], !body.isEmpty {
                kind = k
                rest = body
            }
        }
        let meta = OwnerDue.parse(rest)
        return (kind, meta.text, meta.owner, meta.due)
    }
}

struct OwnerDue {
    var text: String
    var owner: String
    var due: String

    static func parse(_ raw: String) -> OwnerDue {
        var rest = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        var owner = ""
        var due = ""
        if rest.hasPrefix("@") {
            let parts = rest.dropFirst().split(separator: " ", maxSplits: 1, omittingEmptySubsequences: true)
            if parts.count == 2 {
                owner = String(parts[0])
                rest = String(parts[1])
            }
        } else if let idx = rest.firstIndex(of: ":") {
            let name = String(rest[..<idx])
            if name.count <= 24, name.first?.isUppercase == true, !name.contains(" ") {
                owner = name
                rest = rest[rest.index(after: idx)...].trimmingCharacters(in: .whitespaces)
            }
        }
        let days = ["today", "tomorrow", "eod", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        var words = rest.split(separator: " ").map(String.init)
        if let last = words.last, days.contains(last.lowercased()) {
            due = OwnerDue.resolve(last.lowercased())
            words.removeLast()
            if let prev = words.last?.lowercased(), prev == "by" || prev == "due" {
                words.removeLast()
            }
            rest = words.joined(separator: " ")
        }
        return OwnerDue(text: rest, owner: owner, due: due)
    }

    static func resolve(_ token: String, now: Date = Date()) -> String {
        let cal = Calendar.current
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        if token == "today" || token == "eod" { return fmt.string(from: now) }
        if token == "tomorrow", let d = cal.date(byAdding: .day, value: 1, to: now) {
            return fmt.string(from: d)
        }
        let weekdays = ["sunday": 1, "monday": 2, "tuesday": 3, "wednesday": 4, "thursday": 5, "friday": 6, "saturday": 7]
        if let target = weekdays[token] {
            let current = cal.component(.weekday, from: now)
            var delta = (target - current + 7) % 7
            if delta == 0 { delta = 7 }
            if let d = cal.date(byAdding: .day, value: delta, to: now) {
                return fmt.string(from: d)
            }
        }
        return ""
    }
}

struct InboxItem: Identifiable, Equatable, Codable {
    var id: String
    var text: String
    var owner: String
    var due: String
    var done: Bool
    var createdAt: Date
    var meetingTitle: String
}

struct AgendaItem: Identifiable, Equatable {
    let id: String
    var text: String
    var done: Bool
}

struct MeetingTemplate: Identifiable {
    let id: String
    let title: String
    let label: String
    let hint: String
    let agenda: [String]

    static let all: [MeetingTemplate] = [
        .init(id: "oneonone", title: "1:1", label: "Start a 1:1", hint: "Wins, blockers, growth", agenda: ["Wins since last time", "Blockers", "Growth", "What to drop"]),
        .init(id: "standup", title: "Standup", label: "Start standup", hint: "Yesterday, today, stuck", agenda: ["Yesterday", "Today", "Blockers"]),
        .init(id: "sales", title: "Sales call", label: "Start a sales call", hint: "Pain, next step, risk", agenda: ["Context", "Pain", "Next step", "Risks"]),
        .init(id: "blank", title: "Meeting", label: "Start blank", hint: "No agenda, just a note", agenda: []),
    ]
}

struct WrapUp: Equatable {
    var summary: String
    var decisions: [String]
    var actions: [String]
    var questions: [String]
    var followup: String
    var source: String
}
