import { BaggageClaim, X } from "lucide-react";
import { useBasket } from "../../state/basket-context";

const PERIOD_LIMIT_USD = 100;

export function BasketRail() {
  const basket = useBasket();
  const totalUsd = basket.entries.reduce(
    (total, entry) => total + (entry.amountUsd ?? 0),
    0,
  );
  const remainingUsd = Math.max(0, PERIOD_LIMIT_USD - totalUsd);
  const progress = (remainingUsd / PERIOD_LIMIT_USD) * 100;

  return (
    <aside className="basket-rail" aria-label="Basket and budget">
      <div className="rail-budget">
        <span>
          This month limit: <strong>{remainingUsd.toFixed(2)}</strong> USDC left
        </span>
        <span
          className="rail-budget-progress"
          role="progressbar"
          aria-label="Monthly budget left"
          aria-valuemin={0}
          aria-valuemax={PERIOD_LIMIT_USD}
          aria-valuenow={remainingUsd}
        >
          <i style={{ width: `${progress}%` }} />
        </span>
      </div>
      <div className="basket-rail-meta">
        <span>
          Quotes execution: <i /> Jupiter
        </span>
        <span>
          Chain: <i className="solana-dot" /> Solana
        </span>
      </div>
      <div className="basket-rail-heading">
        <h2>Your basket</h2>
        <span>{basket.count} assets</span>
      </div>
      {basket.entries.length ? (
        <div className="basket-rail-list">
          {basket.entries.map((entry) => (
            <div className="basket-rail-row" key={entry.id}>
              <span className="basket-rail-mark">
                {entry.title.slice(0, 2).toUpperCase()}
              </span>
              <span className="basket-rail-name">
                <strong>{entry.title}</strong>
                <small>{entry.kind === "idea" ? "Idea" : "Asset"}</small>
              </span>
              <span className="basket-rail-amount">
                <strong>{(entry.amountUsd ?? 0).toFixed(2)}</strong>
                <small>USDC</small>
              </span>
              <button
                type="button"
                aria-label={`Remove ${entry.title} from basket`}
                onClick={() => basket.remove(entry.id)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="basket-rail-empty">
          <BaggageClaim aria-hidden="true" />
          <span>Your basket is empty</span>
        </div>
      )}
    </aside>
  );
}
