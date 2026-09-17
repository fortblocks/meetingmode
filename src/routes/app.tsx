import { createFileRoute } from "@tanstack/react-router";
import { Download } from "@/components/marketing/Download";

export const Route = createFileRoute("/app")({
  component: AppDownload,
});

function AppDownload() {
  return <Download />;
}
