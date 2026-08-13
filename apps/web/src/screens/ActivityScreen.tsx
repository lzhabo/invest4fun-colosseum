import { Activity } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function ActivityScreen() {
  return (
    <div className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Operation evidence</p>
        <h1>Activity</h1>
        <p>
          Funding, trades and withdrawals will be tracked through their complete
          lifecycle.
        </p>
      </div>
      <EmptyState
        Icon={Activity}
        title="No activity yet"
        description="Submitted and reconciled operations will appear here when execution is implemented."
      />
    </div>
  );
}
