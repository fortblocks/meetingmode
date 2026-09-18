import SwiftUI

struct MenuExtraView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("meeting mode")
                    .font(.system(size: 13, weight: .semibold))
                Spacer()
                Text(state.isOn ? state.elapsedLabel : state.version)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 10)

            Divider()

            Toggle(isOn: Binding(
                get: { state.isOn },
                set: { _ in state.toggleFocus() }
            )) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.isOn ? "On" : "Off")
                        .font(.system(size: 14, weight: .semibold))
                    Text(state.isOn
                         ? "Focus is running. Capture from the HUD or here."
                         : "Flip on when the meeting is about to start.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .toggleStyle(.switch)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            eventBlock
                .padding(.horizontal, 14)
                .padding(.vertical, 12)

            if !state.isOn {
                Divider()
                VStack(alignment: .leading, spacing: 6) {
                    Text("Start now")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                    ForEach(MeetingTemplate.all) { t in
                        Button {
                            state.startMode(template: t)
                        } label: {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(t.label)
                                Text(t.hint)
                                    .font(.system(size: 10))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
            }

            if !state.isOn, state.events.count > 1 {
                Divider()
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                    ForEach(Array(state.events.prefix(4))) { ev in
                        Button {
                            state.activeEventID = ev.id
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(ev.title).lineLimit(1)
                                    Text(ev.rangeLabel)
                                        .font(.system(size: 10))
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(ev.relativeLabel)
                                    .font(.system(size: 10))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
            }

            if state.isOn {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Capture")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                    SessionCaptureStrip()
                    if let last = state.captures.last {
                        Text("\(last.kind.label) · \(last.text)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    if !state.agendaItems.isEmpty {
                        Text("Agenda \(state.agendaItems.filter { $0.done }.count)/\(state.agendaItems.count)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
            }

            if let hint = state.listenHint {
                Text(hint)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 14)
                    .padding(.top, 6)
            }

            Divider()

            VStack(alignment: .leading, spacing: 2) {
                Button(state.listening ? "Stop listening" : "Start listening") {
                    if state.listening { state.stopListening() } else { state.requestListening() }
                }
                Button("Briefing") { state.openBriefing() }
                Button("Open actions") { state.openInbox() }
                Button("Open note") { state.openNoteEditor() }
                if state.isOn {
                    Button(state.wrapBusy ? "Wrapping…" : "Wrap up now") {
                        Task { await state.requestWrapUp() }
                    }
                    .disabled(state.wrapBusy)
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 14)
            .padding(.top, 8)

            Spacer(minLength: 8)

            HStack {
                Button("Settings") { state.openSettings() }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Quit") { state.quit() }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
            }
            .font(.system(size: 12))
            .padding(.horizontal, 14)
            .padding(.bottom, 12)
        }
        .frame(width: 320)
    }

    @ViewBuilder
    private var eventBlock: some View {
        if state.isOn {
            VStack(alignment: .leading, spacing: 6) {
                Text(state.sessionTitle)
                    .font(.system(size: 13, weight: .medium))
                    .lineLimit(2)
                if let event = state.activeEvent {
                    Text("\(event.rangeLabel) · \(event.remainingLabel)")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                    if event.conferenceURL != nil {
                        Button(event.conferenceLabel.map { "Join \($0)" } ?? "Join") {
                            state.openJoin()
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                }
            }
        } else if let event = state.events.first {
            VStack(alignment: .leading, spacing: 6) {
                Text(event.title)
                    .font(.system(size: 13, weight: .medium))
                    .lineLimit(2)
                Text("\(event.rangeLabel) · \(event.relativeLabel)")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                if !event.calendarName.isEmpty {
                    Text(event.calendarName)
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                }
                if !event.attendees.isEmpty {
                    Text(event.attendees.joined(separator: " · "))
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                HStack(spacing: 8) {
                    if event.conferenceURL != nil {
                        Button(event.conferenceLabel.map { "Join \($0)" } ?? "Join") {
                            state.openJoin()
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                    Button("Note") { state.openNoteEditor() }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text(state.calendarDenied
                     ? "Calendar access is off"
                     : (state.calendarAuthorized ? "No upcoming event" : "Calendar access needed"))
                    .font(.system(size: 13, weight: .medium))
                Text(state.calendarDenied
                     ? "Allow Calendar in System Settings, then add your Google account. You can also paste a Google iCal link in Settings."
                     : "Link Google Calendar so the next event sits here — or start a 1:1 below.")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 8) {
                    if state.calendarDenied || !state.calendarAuthorized {
                        Button("Allow Calendar") {
                            Task { await state.refreshCalendar() }
                            state.openCalendarPrivacy()
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                    Button("Add Google account") { state.openGoogleAccountSettings() }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                }
                Button("Open Google Calendar") { state.openGoogleCalendar() }
                    .buttonStyle(.plain)
                    .font(.system(size: 11))
            }
        }
    }
}
