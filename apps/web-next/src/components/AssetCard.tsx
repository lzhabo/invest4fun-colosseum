import type { FeedItem } from "@invest4fun/contracts";
import type { FeedDecision } from "@src/stores/FeedStore";
import { Check, TrendingDown, TrendingUp, X } from "lucide-react";
import type { PointerEventHandler } from "react";
import styled from "styled-components";

const Card = styled.article<{ $dragX: number }>`
  position: relative;
  display: flex;
  overflow: hidden;
  min-height: 540px;
  flex-direction: column;
  padding: clamp(24px, 5vw, 44px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.card};
  transform: translateX(${({ $dragX }) => $dragX}px)
    rotate(${({ $dragX }) => $dragX / 28}deg);
  transition: transform 160ms ease;
  touch-action: pan-y;
  user-select: none;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TokenMark = styled.span`
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.canvas};
  font-size: 1.05rem;
  font-weight: 800;
`;

const TokenName = styled.div`
  h2 {
    margin: 0;
    font-size: clamp(2rem, 6vw, 3.6rem);
    line-height: 0.95;
    letter-spacing: -0.055em;
  }

  p {
    margin: 7px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Price = styled.div`
  margin: 48px 0 36px;

  strong {
    display: block;
    font-size: clamp(2.4rem, 7vw, 4.8rem);
    line-height: 1;
    letter-spacing: -0.065em;
  }
`;

const Change = styled.span<{ $negative: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  color: ${({ $negative, theme }) =>
    $negative ? theme.colors.negative : theme.colors.positive};
  font-weight: 700;
`;

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin: auto 0 28px;

  div {
    padding-top: 14px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.78rem;
  }

  dd {
    margin: 5px 0 0;
    font-weight: 700;
  }
`;

const Footer = styled.footer`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};

  p {
    max-width: 560px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }

  span {
    white-space: nowrap;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

const DecisionOverlay = styled.div<{ $decision: FeedDecision }>`
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 12px;
  background: ${({ $decision, theme }) =>
    $decision === "add" ? theme.colors.positive : theme.colors.negative};
  color: white;
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    margin: auto;
  }
`;

export function AssetCard({
  item,
  decision,
  dragX,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  item: FeedItem;
  decision: FeedDecision | null;
  dragX: number;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
  onPointerCancel: PointerEventHandler<HTMLElement>;
}) {
  const change = item.priceChange24hPct ?? 0;
  const negative = change < 0;

  return (
    <Card
      $dragX={dragX}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {decision ? (
        <DecisionOverlay $decision={decision} aria-live="polite">
          {decision === "add" ? <Check /> : <X />}
          <strong>{decision === "add" ? "Added to basket" : "Skipped"}</strong>
        </DecisionOverlay>
      ) : null}

      <Header>
        <TokenMark>{item.symbol.slice(0, 4)}</TokenMark>
        <TokenName>
          <h2>{item.symbol}</h2>
          <p>{item.name}</p>
        </TokenName>
      </Header>

      <Price>
        <strong>{formatPrice(item.priceUsd)}</strong>
        <Change $negative={negative}>
          {negative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
          {change > 0 ? "+" : ""}
          {change.toFixed(2)}% today
        </Change>
      </Price>

      <Stats>
        <div>
          <dt>Market cap</dt>
          <dd>{formatCompactUsd(item.marketCapUsd)}</dd>
        </div>
        <div>
          <dt>24h volume</dt>
          <dd>{formatCompactUsd(item.volume24hUsd)}</dd>
        </div>
      </Stats>

      <Footer>
        <p>{item.rationale}</p>
        <span>{item.riskLabel} risk</span>
      </Footer>
    </Card>
  );
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "Price unavailable";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
}

function formatCompactUsd(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}
