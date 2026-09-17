import { createFileRoute } from "@tanstack/react-router";
import { MacDesktop } from "@/components/meeting/MacDesktop";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppDesktop,
});

function AppDesktop() {
  return <MacDesktop />;
}
