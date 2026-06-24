import type { User } from "@/lib/types";
import { CardTitle } from "./CardTitle";

export function CreatorLevel({ user }: { user: User }) {
  const lvl = user.level;
  if (!lvl) return null;

  const subtitle = lvl.next_level_name
    ? `${lvl.videos_to_next} more clip${lvl.videos_to_next === 1 ? "" : "s"} to ${lvl.next_level_name}`
    : "Max level reached";

  return (
    <div className="card level-card-wrap">
      <CardTitle
        title={lvl.level_name}
        icon={lvl.level_icon}
        subtitle={subtitle}
        action={<span className="muted" style={{ fontSize: ".82rem" }}>{user.videos_processed} cleaned</span>}
      />
      <div
        className="level-bar"
        role="progressbar"
        aria-valuenow={lvl.level_progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level progress: ${lvl.level_progress}%`}
      >
        <i style={{ width: `${lvl.level_progress}%` }} />
      </div>
    </div>
  );
}
