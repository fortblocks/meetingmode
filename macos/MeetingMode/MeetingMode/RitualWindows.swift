import AppKit
import SwiftUI

struct NoteEditorView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(state.currentNoteURL?.lastPathComponent ?? "No note yet")
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(.secondary)
            if state.isOn {
                SessionCaptureStrip()
            }
            TextEditor(text: $state.noteContent)
                .font(.system(size: 13, design: .monospaced))
                .onChange(of: state.noteContent) { _, value in
                    if let url = state.currentNoteURL {
                        NotesService.shared.write(url, content: value)
                    }
                }
        }
        .padding(14)
        .frame(minWidth: 480, minHeight: 360)
    }
}

struct BriefingView: View {
    @EnvironmentObject private var state: AppState
    var event: MeetingEvent? { state.activeEvent }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(state.sessionTitle)
                    .font(.title2.weight(.semibold))
                if let event {
                    Text("\(event.rangeLabel) · \(event.relativeLabel)")
                        .foregroundStyle(.secondary)
                    if event.conferenceURL != nil {
                        Button("Join \(event.conferenceLabel ?? "call")") { state.openJoin() }
                            .buttonStyle(.borderedProminent)
                    }
                    if !event.attendees.isEmpty {
                        labeled("Who", event.attendees.joined(separator: " · "))
                    }
                } else if state.isOn {
                    Text("Ad-hoc — no calendar block").foregroundStyle(.secondary)
                } else {
                    Text("No upcoming event. The note still writes to ~/Meeting Mode.")
                        .foregroundStyle(.secondary)
                }
                if !state.agendaItems.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Agenda").font(.caption).foregroundStyle(.secondary)
                        ForEach(state.agendaItems) { item in
                            Button {
                                state.toggleAgenda(item.id)
                            } label: {
                                HStack(alignment: .top) {
                                    Image(systemName: item.done ? "checkmark.square.fill" : "square")
                                    Text(item.text)
                                        .strikethrough(item.done)
                                        .foregroundStyle(item.done ? .secondary : .primary)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                let open = state.inbox.filter { !$0.done }
                if !open.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Open from last time").font(.caption).foregroundStyle(.secondary)
                        ForEach(open.prefix(5)) { item in
                            Button {
                                state.toggleInbox(item.id)
                            } label: {
                                VStack(alignment: .leading) {
                                    Text(item.text)
                                    Text("\(item.owner)\(item.due.isEmpty ? "" : " · \(item.due)")")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                if !state.agenda.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    labeled("Your talking points", state.agenda)
                }
                Button("Open the note") { state.openNoteEditor() }
                Button("Open actions") { state.openInbox() }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .frame(minWidth: 400, minHeight: 320)
    }

    func labeled(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(body)
        }
    }
}

struct WrapUpView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if state.wrapBusy {
                    Text("Grok is writing the wrap-up…").foregroundStyle(.secondary)
                }
                if state.wrapUp == nil && !state.wrapBusy {
                    Text(state.captures.isEmpty
                         ? "Capture actions, decisions, and notes during the call, then wrap up."
                         : "\(state.captures.count) captures ready.")
                        .foregroundStyle(.secondary)
                    ForEach(state.captures) { c in
                        Text("\(c.kind.label) · \(c.text)").font(.callout)
                    }
                    Button("Write wrap-up") { Task { await state.requestWrapUp() } }
                        .buttonStyle(.borderedProminent)
                }
                if let wrap = state.wrapUp {
                    if wrap.source.hasPrefix("offline") {
                        Text(wrap.source).font(.caption).foregroundStyle(.secondary)
                    }
                    labeled("Summary", wrap.summary)
                    labeled("Decisions", wrap.decisions.joined(separator: "\n"))
                    labeled("Actions", wrap.actions.joined(separator: "\n"))
                    labeled("Open questions", wrap.questions.joined(separator: "\n"))
                    labeled("Follow-up email", wrap.followup)
                    Button("Copy follow-up") {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(wrap.followup, forType: .string)
                    }
                    Button("Open inbox") { state.openInbox() }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .frame(minWidth: 420, minHeight: 360)
    }

    func labeled(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(body.isEmpty ? "—" : body)
        }
    }
}

struct InboxView: View {
    @EnvironmentObject private var state: AppState
    @State private var draft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(state.inbox.filter { !$0.done }.count) open")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                TextField("Alex: send usage Friday", text: $draft)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { add() }
                Button("Add") { add() }
            }
            List {
                ForEach(state.inbox) { item in
                    Button {
                        state.toggleInbox(item.id)
                    } label: {
                        HStack(alignment: .top) {
                            Image(systemName: item.done ? "checkmark.square.fill" : "square")
                            VStack(alignment: .leading) {
                                Text(item.text).strikethrough(item.done)
                                Text("\(item.owner)\(item.due.isEmpty ? "" : " · \(item.due)") · \(item.meetingTitle)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(14)
        .frame(minWidth: 360, minHeight: 320)
    }

    private func add() {
        let t = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return }
        state.capture("/a \(t)")
        draft = ""
    }
}

struct SessionCaptureStrip: View {
    @EnvironmentObject private var state: AppState
    @State private var draft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                ForEach(Capture.Kind.allCases) { kind in
                    Button(kind.label) { state.captureKind = kind }
                        .buttonStyle(.borderless)
                        .foregroundStyle(state.captureKind == kind ? Color.primary : Color.secondary)
                        .font(.caption.weight(state.captureKind == kind ? .semibold : .regular))
                }
            }
            HStack {
                TextField("Capture a line", text: $draft)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { go() }
                Button("Add") { go() }
            }
        }
    }

    private func go() {
        state.capture(draft)
        draft = ""
    }
}
