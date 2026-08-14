import { CircleUserRound } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { EmptyState } from "../components/ui/EmptyState";

export function AccountScreen() {
  const auth = useAuth();

  if (auth.authenticated) {
    const email = auth.user?.email?.address;
    return (
      <div className="screen">
        <div className="screen-heading">
          <p className="eyebrow">Identity and access</p>
          <h1>Account</h1>
          <p>Your Invest4Fun account is connected through Privy.</p>
        </div>
        <section className="account-panel">
          <span className="section-label">Authenticated user</span>
          <strong>{email ?? auth.user?.id}</strong>
          <span className="source-note">
            Privy identity is linked separately from the internal Invest4Fun
            user.
          </span>
          <button
            type="button"
            className="select-button"
            onClick={() => void auth.logout()}
          >
            Sign out
          </button>
        </section>
      </div>
    );
  }

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
        description={
          auth.configured
            ? "Sign in with email or an existing Solana wallet to create your Invest4Fun session."
            : "Set VITE_PRIVY_APP_ID to enable Privy email and Solana wallet login."
        }
      />
    </div>
  );
}
