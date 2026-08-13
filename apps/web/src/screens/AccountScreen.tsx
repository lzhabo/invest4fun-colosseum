import { CircleUserRound } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function AccountScreen() {
  return (
    <div className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Identity and access</p>
        <h1>Account</h1>
        <p>
          The Invest4Fun user will remain independent from any single login
          provider or wallet.
        </p>
      </div>
      <EmptyState
        Icon={CircleUserRound}
        title="Account setup is pending"
        description="Privy identities and the embedded wallet will be connected after the identity contract is confirmed."
      />
    </div>
  );
}
