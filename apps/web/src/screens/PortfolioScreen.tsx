import { PieChart } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function PortfolioScreen() {
  return (
    <div className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Invest4Fun wallet</p>
        <h1>Portfolio</h1>
        <p>Only assets held in the Invest4Fun wallet will be shown here.</p>
      </div>
      <EmptyState
        Icon={PieChart}
        title="No positions yet"
        description="Portfolio data will appear after a confirmed investment settles onchain."
      />
    </div>
  );
}
