import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Form {
            Section("Ritual") {
                LabeledContent("Version", value: state.version)
                LabeledContent("Shortcut", value: "Control-Option-M")
                LabeledContent("Notes folder", value: "~/Meeting Mode")
                Toggle("Offer 5 minutes before a conference", isOn: $state.autoOfferCalendar)
                    .onChange(of: state.autoOfferCalendar) { _, _ in state.savePrefs() }
                Toggle("Write wrap-up on End", isOn: $state.saveWrapUp)
                    .onChange(of: state.saveWrapUp) { _, _ in state.savePrefs() }
                Toggle("Warn 5 minutes before the calendar end", isOn: $state.warnBeforeEnd)
                    .onChange(of: state.warnBeforeEnd) { _, _ in state.savePrefs() }
            }
            Section("Calendar") {
                Text(state.calendarAuthorized
                     ? "Calendar access is on. Today’s events appear in the menu extra."
                     : "Grant calendar access when prompted so Join can use the real next meeting.")
                    .foregroundStyle(.secondary)
                Button("Refresh events") {
                    Task { await state.refreshCalendar() }
                }
            }
            Section("Capture") {
                Text("Type in the HUD or menu extra. Prefixes: /a action, /d decision, /p parked, /q question. Owners: Alex: … or @Alex. Dues: Friday. Actions also land in ~/Meeting Mode/inbox.json.")
                    .foregroundStyle(.secondary)
            }
            Section("Talking points") {
                TextEditor(text: $state.agenda)
                    .font(.body)
                    .frame(minHeight: 56)
                    .onChange(of: state.agenda) { _, _ in state.savePrefs() }
                TextEditor(text: $state.userContext)
                    .font(.body)
                    .frame(minHeight: 44)
                    .onChange(of: state.userContext) { _, _ in state.savePrefs() }
            }
            Section("Grok") {
                SecureField("xAI API key (optional)", text: $state.apiKey)
                    .onChange(of: state.apiKey) { _, _ in state.savePrefs() }
                Text("Wrap-up uses this key when set. Without it, wrap-up is an offline draft from your captures. Listening STT lands in a later build.")
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .frame(width: 440, height: 480)
    }
}
