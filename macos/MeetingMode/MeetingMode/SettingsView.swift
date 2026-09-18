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
                     ? "Mac Calendar is on. Google events appear once that account is in Internet Accounts, or you paste an iCal link below."
                     : "Grant Calendar access, add your Google account to this Mac, or paste a Google iCal link.")
                    .foregroundStyle(.secondary)
                if state.calendarDenied {
                    Button("Open Calendar privacy settings") { state.openCalendarPrivacy() }
                }
                Button("Add Google account…") { state.openGoogleAccountSettings() }
                Button("Open Google Calendar") { state.openGoogleCalendar() }
                Button(state.calendarBusy ? "Refreshing…" : "Refresh events") {
                    Task { await state.refreshCalendar() }
                }
                .disabled(state.calendarBusy)
            }
            Section("Google Calendar iCal") {
                Text("Google Calendar → Settings → the calendar → Integrate calendar → Secret address in iCal format.")
                    .foregroundStyle(.secondary)
                TextField("https://calendar.google.com/calendar/ical/…", text: $state.icsUrl)
                    .textFieldStyle(.roundedBorder)
                    .onChange(of: state.icsUrl) { _, _ in state.savePrefs() }
                    .onSubmit {
                        state.savePrefs()
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
        .frame(width: 460, height: 620)
    }
}
