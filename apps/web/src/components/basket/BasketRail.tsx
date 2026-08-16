import { BaggageClaim, X } from "lucide-react";
import styled from "styled-components";
import { useBasket } from "../../state/basket-context";

const PERIOD_LIMIT_USD = 100;

const Rail = styled.aside`
  min-width: 0;
  padding: 30px 26px;
  border-left: 1px solid var(--line);
  background: color-mix(in srgb, var(--ground) 78%, var(--paper));

  html[data-theme="dark"] & {
    background: #0b1210;
  }

  @media (max-width: 900px) {
    border-top: 1px solid var(--line);
    border-left: 0;
  }
`;

const Budget = styled.div`
  display: grid;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;

  strong {
    color: var(--ink);
    font-size: 14px;
  }
`;

const BudgetProgress = styled.span`
  display: block;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--line);

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--acid);
    transition: width 180ms ease;
  }
`;

const RailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 26px;
  color: var(--muted);
  font-size: 11px;

  i {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin: 0 4px;
    border-radius: 50%;
    background: #ff3b8d;
  }

  .solana-dot {
    background: var(--acid);
  }
`;

const RailHeading = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 44px;

  h2 {
    margin: 0;
    font: 22px / 1.1 var(--font-brand);
  }

  > span {
    color: var(--muted);
    font-size: 12px;
  }
`;

const RailList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 24px;
`;

const RailRow = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 28px;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
`;

const RailMark = styled.span`
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--acid);
  color: #07110d;
  font-size: 10px;
  font-weight: 900;
`;

const RailCopy = styled.span`
  display: grid;
  min-width: 0;
  gap: 3px;

  strong {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--muted);
    font-size: 10px;
  }
`;

const RailAmount = styled(RailCopy)`
  justify-items: end;
`;

const RemoveButton = styled.button`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-left: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  cursor: pointer;

  &:hover {
    color: var(--coral);
  }

  svg {
    width: 17px;
    height: 17px;
  }
`;

const EmptyRail = styled.div`
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 34px 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;

  svg {
    width: 25px;
    height: 25px;
    color: var(--blue);
  }
`;

export function BasketRail() {
  const basket = useBasket();
  const totalUsd = basket.entries.reduce(
    (total, entry) => total + (entry.amountUsd ?? 0),
    0,
  );
  const remainingUsd = Math.max(0, PERIOD_LIMIT_USD - totalUsd);
  const progress = (remainingUsd / PERIOD_LIMIT_USD) * 100;

  return (
    <Rail aria-label="Basket and budget">
      <Budget>
        <span>
          This month limit: <strong>{remainingUsd.toFixed(2)}</strong> USDC left
        </span>
        <BudgetProgress
          role="progressbar"
          aria-label="Monthly budget left"
          aria-valuemin={0}
          aria-valuemax={PERIOD_LIMIT_USD}
          aria-valuenow={remainingUsd}
        >
          <i style={{ width: `${progress}%` }} />
        </BudgetProgress>
      </Budget>
      <RailMeta>
        <span>
          Quotes execution: <i /> Jupiter
        </span>
        <span>
          Chain: <i className="solana-dot" /> Solana
        </span>
      </RailMeta>
      <RailHeading>
        <h2>Your basket</h2>
        <span>{basket.count} assets</span>
      </RailHeading>
      {basket.entries.length ? (
        <RailList>
          {basket.entries.map((entry) => (
            <RailRow key={entry.id}>
              <RailMark>{entry.title.slice(0, 2).toUpperCase()}</RailMark>
              <RailCopy>
                <strong>{entry.title}</strong>
                <small>{entry.kind === "idea" ? "Idea" : "Asset"}</small>
              </RailCopy>
              <RailAmount>
                <strong>{(entry.amountUsd ?? 0).toFixed(2)}</strong>
                <small>USDC</small>
              </RailAmount>
              <RemoveButton
                type="button"
                aria-label={`Remove ${entry.title} from basket`}
                onClick={() => basket.remove(entry.id)}
              >
                <X aria-hidden="true" />
              </RemoveButton>
            </RailRow>
          ))}
        </RailList>
      ) : (
        <EmptyRail>
          <BaggageClaim aria-hidden="true" />
          <span>Your basket is empty</span>
        </EmptyRail>
      )}
    </Rail>
  );
}
