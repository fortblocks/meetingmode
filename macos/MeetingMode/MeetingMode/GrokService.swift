import Foundation

enum GrokService {
    static func wrapUp(title: String, notes: String, transcript: String, key: String) async -> WrapUp {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return offline(title: title, notes: notes, transcript: transcript, error: "No API key")
        }
        var req = URLRequest(url: URL(string: "https://api.x.ai/v1/chat/completions")!)
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.addValue("Bearer \(trimmed)", forHTTPHeaderField: "Authorization")
        let system = """
        You write meeting wrap-ups. Output JSON only, no markdown:
        { "summary": "", "decisions": [""], "actions": [{"owner": "", "task": "", "due": ""}], "open_questions": [""], "followup_email": "" }
        Rules: no invented facts or numbers. If owner is unknown use "Unassigned". Keep summary to 2-5 sentences.
        """
        let user = "Event title: \(title)\n\nUser notes:\n\(notes)\n\nTranscript:\n\(transcript)"
        let body: [String: Any] = [
            "model": "grok-4.5",
            "temperature": 0.2,
            "max_tokens": 900,
            "messages": [
                ["role": "system", "content": system],
                ["role": "user", "content": user],
            ],
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return offline(title: title, notes: notes, transcript: transcript, error: "xAI error")
            }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let choices = json?["choices"] as? [[String: Any]]
            let message = choices?.first?["message"] as? [String: Any]
            let text = message?["content"] as? String ?? ""
            if let parsed = parse(text) { return parsed }
            return offline(title: title, notes: notes, transcript: transcript, error: "Could not parse wrap-up")
        } catch {
            return offline(title: title, notes: notes, transcript: transcript, error: error.localizedDescription)
        }
    }

    private static func parse(_ text: String) -> WrapUp? {
        guard let start = text.firstIndex(of: "{"),
              let end = text.lastIndex(of: "}"),
              start < end,
              let data = String(text[start...end]).data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        let summary = obj["summary"] as? String ?? ""
        guard !summary.isEmpty else { return nil }
        let decisions = obj["decisions"] as? [String] ?? []
        let questions = obj["open_questions"] as? [String] ?? []
        let followup = obj["followup_email"] as? String ?? ""
        let actions = (obj["actions"] as? [[String: Any]] ?? []).map { a in
            let task = a["task"] as? String ?? ""
            let owner = a["owner"] as? String ?? "Unassigned"
            let due = a["due"] as? String ?? ""
            return due.isEmpty ? "\(task) — \(owner)" : "\(task) — \(owner) (\(due))"
        }
        return WrapUp(
            summary: summary,
            decisions: decisions,
            actions: actions,
            questions: questions,
            followup: followup,
            source: "grok"
        )
    }

    static func offline(title: String, notes: String, transcript: String, error: String) -> WrapUp {
        let lines = transcript
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let decisions = lines.filter { $0.lowercased().contains("decision") }
        let actions = lines.filter {
            let l = $0.lowercased()
            return l.hasPrefix("action") || l.contains("action:")
        }
        let head = Array(lines.prefix(3)).joined(separator: " ")
        let questions = Array(lines.filter { $0.contains("?") }.prefix(4))
        return WrapUp(
            summary: "Offline draft for “\(title)”. \(head)".trimmingCharacters(in: .whitespaces),
            decisions: decisions.isEmpty ? ["None captured offline."] : decisions,
            actions: actions.isEmpty ? ["Review the note and confirm owners"] : actions,
            questions: questions,
            followup: "Hi all,\n\nNotes from \(title):\n\n\(notes)\n\nThanks",
            source: "offline · \(error)"
        )
    }

}
