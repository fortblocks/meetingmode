import AppKit
import SwiftUI

final class StatusItemController {
    private let item: NSStatusItem
    private let state: AppState
    private var popover = NSPopover()

    init(state: AppState) {
        self.state = state
        item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        item.button?.image = StatusItemController.icon(on: false)
        item.button?.imagePosition = .imageLeading
        item.button?.toolTip = "Meeting Mode"
        item.button?.action = #selector(togglePopover)
        item.button?.target = self

        popover.behavior = .transient
        popover.animates = true
        popover.contentSize = NSSize(width: 320, height: 360)
        popover.contentViewController = NSHostingController(
            rootView: MenuExtraView().environmentObject(state)
        )

        NotificationCenter.default.addObserver(
            forName: .init("MeetingMode.FocusChanged"),
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.item.button?.image = StatusItemController.icon(on: AppState.shared.isOn)
            }
        }
    }

    @objc private func togglePopover() {
        guard let button = item.button else { return }
        if popover.isShown {
            popover.performClose(nil)
        } else {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            popover.contentViewController?.view.window?.makeKey()
        }
    }

    static func icon(on: Bool) -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { rect in
            let inset = rect.insetBy(dx: 2.2, dy: 2.2)
            let ring = NSBezierPath(ovalIn: inset)
            ring.lineWidth = 1.5
            NSColor.labelColor.setStroke()
            ring.stroke()
            let inner = NSBezierPath(ovalIn: rect.insetBy(dx: 7.2, dy: 7.2))
            (on ? NSColor.systemGreen : NSColor.labelColor.withAlphaComponent(0.55)).setFill()
            inner.fill()
            return true
        }
        image.isTemplate = !on
        return image
    }
}
