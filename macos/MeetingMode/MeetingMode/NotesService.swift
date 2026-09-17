import Foundation

final class NotesService {
    static let shared = NotesService()

    var folder: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Meeting Mode", isDirectory: true)
    }

    func ensureFolder() {
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    }

    func todayURL() -> URL {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return folder.appendingPathComponent("\(f.string(from: Date())).md")
    }

    @discardableResult
    func openOrCreateToday() -> URL {
        ensureFolder()
        let url = todayURL()
        if !FileManager.default.fileExists(atPath: url.path) {
            let title = DateFormatter.localizedString(from: Date(), dateStyle: .full, timeStyle: .none)
            let seed = """
            # \(title)

            - 
            """
            try? seed.write(to: url, atomically: true, encoding: .utf8)
        }
        return url
    }
}
