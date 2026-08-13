import { ArrowRight, Sparkles } from "lucide-react";

export function FeedScreen() {
  return (
    <div className="screen feed-screen">
      <div className="screen-heading">
        <p className="eyebrow">Investment workspace</p>
        <h1>Build your next investment</h1>
        <p>
          Funding, recommendations and execution will appear here as their
          product contracts are agreed.
        </p>
      </div>

      <section className="workspace-panel">
        <div className="workspace-copy">
          <span className="section-label">Foundation ready</span>
          <h2>Your Invest4Fun flow starts here</h2>
          <p>
            The interface is connected to the new API boundary. Authentication
            and funding stay disabled until their rules are explicit.
          </p>
          <button type="button" className="primary-button" disabled>
            Continue setup <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <div className="signal-visual" aria-hidden="true">
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="signal-center">
            <Sparkles />
          </div>
        </div>
      </section>
    </div>
  );
}
