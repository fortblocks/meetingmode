import Foundation
import UserNotifications

final class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationService()

    func request() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func offer(event: MeetingEvent) {
        let content = UNMutableNotificationContent()
        content.title = "Start Meeting Mode?"
        content.body = "\(event.title) starts in 5 minutes. Briefing, note, and capture will be ready. Listening stays off."
        content.sound = .default
        let req = UNNotificationRequest(
            identifier: "mm-offer-\(event.id)",
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(req)
    }

    func ending(title: String, over: Bool) {
        let content = UNMutableNotificationContent()
        content.title = over ? "Time is up" : "Five minutes left"
        content.body = over
            ? "\(title) ended. Wrap up from what you captured."
            : "\(title) has five minutes left."
        content.sound = .default
        let req = UNNotificationRequest(
            identifier: "mm-end-\(over ? "over" : "five")",
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(req)
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        await MainActor.run {
            AppState.shared.startMode()
        }
    }
}
