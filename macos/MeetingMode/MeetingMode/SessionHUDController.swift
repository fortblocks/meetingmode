import AppKit
import SwiftUI

@MainActor
final class SessionHUDController {
    private var panel: NSPanel?
    private let state: AppState

    init(state: AppState) {
        self.state = state
    }

    func setVisible(_ visible: Bool) {
        if visible {
            if panel == nil { build() }
            panel?.orderFrontRegardless()
        } else {
            panel?.orderOut(nil)
        }
    }

    private func build() {
        let hosting = NSHostingController(rootView: SessionHUDView().environmentObject(state))
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 148),
            styleMask: [.titled, .nonactivatingPanel, .utilityWindow],
            backing: .buffered,
            defer: false
        )
        panel.title = "Meeting Mode"
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.contentViewController = hosting
        if let screen = NSScreen.main {
            let x = screen.visibleFrame.midX - 210
            let y = screen.visibleFrame.minY + 24
            panel.setFrameOrigin(NSPoint(x: x, y: y))
        }
        self.panel = panel
    }
}

struct SessionHUDView: View {
    @EnvironmentObject private var state: AppState
    @State private var draft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.sessionTitle)
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                    Text("\(state.elapsedLabel)\(state.activeEvent.map { " · \($0.remainingLabel)" } ?? "") · \(state.captures.count) captures\(state.agendaItems.isEmpty ? "" : " · \(state.agendaItems.filter { $0.done }.count)/\(state.agendaItems.count)")")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button("Wrap up") { Task { await state.requestWrapUp() } }
                    .controlSize(.small)
                Button("End") { state.stopMode() }
                    .controlSize(.small)
            }
            HStack(spacing: 6) {
                ForEach(Capture.Kind.allCases) { kind in
                    Button(kind.label) { state.captureKind = kind }
                        .buttonStyle(.bordered)
                        .tint(state.captureKind == kind ? .accentColor : .secondary)
                        .controlSize(.mini)
                }
            }
            HStack {
                TextField("Capture  ·  /a /d /p /q", text: $draft)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { submit() }
                Button("Add") { submit() }
                    .controlSize(.small)
            }
        }
        .padding(12)
        .frame(width: 420)
    }

    private func submit() {
        state.capture(draft)
        draft = ""
    }
}
