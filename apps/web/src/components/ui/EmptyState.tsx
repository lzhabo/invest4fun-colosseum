import type { LucideIcon } from "lucide-react";

export function EmptyState({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
