import type { ReactNode } from "react";

export function CardTitle({
  title,
  icon,
  action,
  subtitle,
}: {
  title: string;
  icon?: string;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="card-title">
      <div className="card-title-left">
        {icon && <span className="card-title-icon" aria-hidden>{icon}</span>}
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="card-title-sub muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-title-action">{action}</div>}
    </div>
  );
}
