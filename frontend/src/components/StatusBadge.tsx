import type { JobStatus } from "@/lib/types";

const LABELS: Record<string, string> = {
  pending: "Queued",
  processing: "Processing",
  finished: "Done",
  skipped: "Skipped",
  failed: "Failed",
  expired: "Expired",
  canceled: "Canceled",
};

export function StatusBadge({ status }: { status: JobStatus | string }) {
  return <span className={`badge s-${status}`}>{LABELS[status] || status}</span>;
}
