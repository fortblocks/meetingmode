import { createFileRoute } from "@tanstack/react-router";
import { MacDesktop } from "@/components/meeting/MacDesktop";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <MacDesktop />;
}
