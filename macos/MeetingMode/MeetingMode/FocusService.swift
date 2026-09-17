import AppKit

enum FocusService {
    static func start() {
        NSWorkspace.shared.hideOtherApplications()
    }

    static func stop() {
    }
}
