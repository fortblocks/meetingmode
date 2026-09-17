import AppKit

enum FocusService {
    static func start() {
        NSWorkspace.shared.hideOtherApplications()
    }

    static func stop() {
        // Notes stay on disk. Other apps remain where the user left them.
    }
}
