import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Form {
            Section("Ritual") {
                LabeledContent("Version", value: state.version)
                LabeledContent("Shortcut", value: "Control-Option-M")
                LabeledContent("Notes folder", value: "~/Meeting Mode")
            }
            Section("Calendar") {
                Text(state.calendarAuthorized
                     ? "Calendar access is on. The next event appears in the menu extra."
                     : "Grant calendar access when prompted so Join can use the real next meeting.")
                    .foregroundStyle(.secondary)
                Button("Refresh events") {
                    Task { await state.refreshCalendar() }
                }
            }
            Section("Listening") {
                Text("Wrap-up and live cues are stubbed in 0.1.0 so you can test the ritual without a signed microphone build. They land in the next version on the download page.")
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .frame(width: 420, height: 360)
    }
}
