import { BriefcaseBusiness, Plus } from "lucide-react";

export function PortfolioScreen() {
  return (
    <main className="legacy-page positions-page">
      <header className="page-heading">
        <span className="eyebrow">Invest4Fun wallet</span>
        <h1>Portfolio</h1>
        <p>Only assets held in the Invest4Fun wallet are shown here.</p>
      </header>
      <section className="portfolio-summary">
        <div className="portfolio-summary-meta">
          <span>Total portfolio value</span>
          <strong>$0.00</strong>
        </div>
        <div className="portfolio-summary-footnote">
          Portfolio data will appear after a confirmed investment settles
          onchain.
        </div>
      </section>
      <section className="positions-empty">
        <BriefcaseBusiness aria-hidden="true" />
        <div>
          <strong>No positions yet</strong>
          <p>Your confirmed assets and Idea attribution will appear here.</p>
        </div>
        <button type="button" className="legacy-primary-button">
          <Plus aria-hidden="true" /> Build a basket
        </button>
      </section>
    </main>
  );
}
