import SwiftUI

struct MenuExtraView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("meeting mode")
                    .font(.system(size: 13, weight: .semibold))
                Spacer()
                Text(state.version)
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
                    Text(state.isOn ? "Focus is running. Other apps are hidden." : "Flip on when the meeting is about to start.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .toggleStyle(.switch)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            Group {
                if let event = state.nextEvent {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(event.title)
                            .font(.system(size: 13, weight: .medium))
                            .lineLimit(2)
                        Text("\(event.rangeLabel) · \(event.relativeLabel)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                        HStack(spacing: 8) {
                            if event.conferenceURL != nil {
                                Button(event.conferenceLabel.map { "Join \($0)" } ?? "Join") {
                                    state.openJoin()
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.small)
                            }
                            Button("Note") { state.openNote() }
                                .buttonStyle(.bordered)
                                .controlSize(.small)
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(state.calendarAuthorized ? "No upcoming event" : "Calendar access needed")
                            .font(.system(size: 13, weight: .medium))
                        Text(state.calendarAuthorized
                             ? "Join appears here when the next Meet, Zoom, Teams, or Webex event is on the calendar."
                             : "Grant calendar access in Settings so the next event can sit in this extra.")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                        Button("Open note") { state.openNote() }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            HStack {
                Button(state.listening ? "Stop listening" : "Start listening") {
                    if state.listening { state.stopListening() } else { state.requestListening() }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 10)

            if let hint = state.listenHint {
                Text(hint)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 14)
                    .padding(.top, 6)
            }

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
}
