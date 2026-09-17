import { createFileRoute } from "@tanstack/react-router";
import { MacDesktop } from "@/components/meeting/MacDesktop";

export const Route = createFileRoute("/preview")({
  ssr: false,
  component: PreviewDesktop,
});

function PreviewDesktop() {
  return <MacDesktop />;
}
