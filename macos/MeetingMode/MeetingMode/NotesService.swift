import Foundation

final class NotesService {
    static let shared = NotesService()

    var folder: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Meeting Mode", isDirectory: true)
    }

    var inboxURL: URL {
        folder.appendingPathComponent("inbox.json")
    }

    func ensureFolder() {
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    }

    func url(for date: Date = Date()) -> URL {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd-HHmm"
        return folder.appendingPathComponent("\(f.string(from: date)).md")
    }

    @discardableResult
    func createSessionNote(
        title: String,
        event: MeetingEvent?,
        talkingPoints: String,
        extraAgenda: [String] = []
    ) -> URL {
        ensureFolder()
        let url = url()
        var lines = [
            "# \(title)",
            "",
            "- Folder: ~/Meeting Mode/",
            "- Started: \(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))",
        ]
        if let event {
            let f = DateFormatter()
            f.timeStyle = .short
            lines.append("- Calendar: \(f.string(from: event.start)) – \(f.string(from: event.end))")
            if let join = event.conferenceURL {
                lines.append("- Join (\(event.conferenceLabel ?? "call")): \(join.absoluteString)")
            }
            if !event.attendees.isEmpty {
                lines.append("- Attendees: \(event.attendees.joined(separator: ", "))")
            }
        }
        let agenda = extraAgenda.isEmpty ? (event?.agenda ?? []) : extraAgenda
        if !agenda.isEmpty {
            lines.append("")
            lines.append("## Agenda")
            lines.append("")
            lines.append(contentsOf: agenda.map { "- \($0)" })
        }
        if !talkingPoints.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lines.append(contentsOf: ["", "## Talking points", "", talkingPoints])
        }
        lines.append(contentsOf: [
            "", "## Notes", "", "",
            "## Actions", "", "",
            "## Decisions", "", "",
            "## Parked", "", "",
            "## Open questions", "", "",
        ])
        try? lines.joined(separator: "\n").write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    func read(_ url: URL) -> String {
        (try? String(contentsOf: url, encoding: .utf8)) ?? ""
    }

    func write(_ url: URL, content: String) {
        try? content.write(to: url, atomically: true, encoding: .utf8)
    }

    func appendCapture(to url: URL, kind: Capture.Kind, text: String) {
        var lines = read(url).components(separatedBy: "\n")
        let heading = "## \(kind.heading)"
        if let i = lines.firstIndex(of: heading) {
            var j = i + 1
            while j < lines.count && !lines[j].hasPrefix("## ") { j += 1 }
            lines.insert("- \(text)", at: j)
        } else {
            lines.append(contentsOf: ["", heading, "", "- \(text)"])
        }
        write(url, content: lines.joined(separator: "\n"))
    }

    func writeSummary(beside note: URL, title: String, wrap: WrapUp) {
        let dest = note.deletingPathExtension().appendingPathExtension("summary.md")
        let banner = wrap.source.hasPrefix("offline")
            ? "\n_Offline draft — \(wrap.source). Review before sending._\n"
            : ""
        let md = """
        # Wrap-up — \(title)
        \(banner)
        ## Summary

        \(wrap.summary)

        ## Decisions
        \(wrap.decisions.map { "- \($0)" }.joined(separator: "\n"))

        ## Actions
        \(wrap.actions.map { "- \($0)" }.joined(separator: "\n"))

        ## Open questions
        \(wrap.questions.map { "- \($0)" }.joined(separator: "\n"))

        ## Follow-up email

        \(wrap.followup)
        """
        write(dest, content: md)
    }

    func loadInbox() -> [InboxItem] {
        ensureFolder()
        guard let data = try? Data(contentsOf: inboxURL),
              let items = try? JSONDecoder().decode([InboxItem].self, from: data)
        else { return [] }
        return items
    }

    func saveInbox(_ items: [InboxItem]) {
        ensureFolder()
        if let data = try? JSONEncoder().encode(items) {
            try? data.write(to: inboxURL, options: .atomic)
        }
    }

    func seedInbox() -> [InboxItem] {
        let items = [
            InboxItem(id: "act-alex-usage", text: "Send Acme usage export", owner: "Alex", due: OwnerDue.resolve("today"), done: false, createdAt: Date(), meetingTitle: "Q3 pipeline review"),
            InboxItem(id: "act-priya-dpa", text: "DPA redlines", owner: "Priya", due: OwnerDue.resolve("friday"), done: false, createdAt: Date(), meetingTitle: "Q3 pipeline review"),
            InboxItem(id: "act-you-acme", text: "Take the Thursday Acme call with Maya", owner: "You", due: "", done: false, createdAt: Date(), meetingTitle: "1:1 with Maya"),
        ]
        saveInbox(items)
        return items
    }

    func listNotes() -> [URL] {
        ensureFolder()
        let files = (try? FileManager.default.contentsOfDirectory(
            at: folder,
            includingPropertiesForKeys: [.contentModificationDateKey],
            options: [.skipsHiddenFiles]
        )) ?? []
        return files
            .filter { $0.pathExtension == "md" }
            .sorted { $0.lastPathComponent > $1.lastPathComponent }
    }
}
