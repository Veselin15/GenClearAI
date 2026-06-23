import type { JobStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: JobStatus | string }) {
  return <span className={`badge s-${status}`}>{status}</span>;
}
