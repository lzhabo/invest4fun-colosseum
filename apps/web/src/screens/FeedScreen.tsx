import type {
  FeedItem,
  MarketChartPeriod,
  MarketChartResponse,
} from "@invest4fun/contracts";
import {
  BaggageClaim,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BasketRail } from "../components/basket/BasketRail";
import { getFeed, getMarketChart } from "../services/api";
import { useBasket } from "../state/basket-context";

const FeedPage = styled.main`
  min-height: calc(100dvh - 74px);
  background: var(--ground);
`;

const FeedWorkspace = styled.section`
  min-height: inherit;
  padding: 42px 38px 128px;
  background:
    linear-gradient(rgba(241, 243, 246, 0.92), rgba(241, 243, 246, 0.92)),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 63px,
      rgba(9, 10, 11, 0.04) 64px
    );

  html[data-theme="dark"] & {
    background:
      linear-gradient(rgba(8, 13, 12, 0.92), rgba(8, 13, 12, 0.92)),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 63px,
        rgba(244, 247, 245, 0.045) 64px
      );
  }

  @media (max-width: 900px) {
    padding-right: 20px;
    padding-left: 20px;
  }

  @media (max-width: 520px) {
    padding: 28px 16px 112px;
  }
`;

const FeedLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(280px, 1fr);
  min-height: calc(100dvh - 74px - 170px);
  margin: -42px -38px -128px;

  @media (max-width: 900px) {
    display: block;
    min-height: 0;
    margin: -42px -20px -100px;
  }

  @media (max-width: 520px) {
    margin: -28px -16px -112px;
  }
`;

const FeedMain = styled.div`
  min-width: 0;
  padding: 42px 38px 128px;

  @media (max-width: 900px) {
    padding: 42px 20px 100px;
  }

  @media (max-width: 520px) {
    padding-bottom: 260px;
  }
`;

const FeedHeading = styled.header`
  max-width: 760px;
  margin: 0 auto 34px;

  h1 {
    margin: 8px 0 12px;
    font: 48px / 0.98 var(--font-brand);
    letter-spacing: 0;
  }

  p {
    max-width: 650px;
    margin: 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.5;
  }

  .source-note {
    display: block;
    margin-top: 14px;
  }

  @media (max-width: 900px) {
    h1 {
      font-size: 40px;
    }
  }

  @media (max-width: 520px) {
    h1 {
      font-size: 34px;
    }
  }
`;

const FeedStatus = styled.div`
  min-height: 420px;
  display: grid;
  place-content: center;
  gap: 10px;
  color: var(--muted);
  text-align: center;

  strong {
    color: var(--ink);
    font: 24px / 1.1 var(--font-brand);
  }
`;

type Feedback = "invest" | "skip";

const SwipeCard = styled.article<{
  $feedback: Feedback | undefined;
  $dragX: number;
}>`
  position: relative;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--paper);
  box-shadow: ${({ $feedback }) =>
    $feedback === "invest"
      ? "16px 14px 0 var(--success)"
      : $feedback === "skip"
        ? "16px 14px 0 var(--coral)"
        : "16px 14px 0 var(--line)"};
  touch-action: pan-y;
  user-select: none;
  transform: translateX(${({ $dragX }) => $dragX}px)
    rotate(${({ $dragX }) => $dragX / 28}deg);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;

  @media (max-width: 520px) {
    min-height: 520px;
    box-shadow: 6px 7px 0 var(--line);
  }
`;

const DecisionFlash = styled.div<{ $feedback: Feedback }>`
  position: absolute;
  z-index: 1;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 10px;
  background: ${({ $feedback }) =>
    $feedback === "invest"
      ? "rgba(33, 164, 71, 0.88)"
      : "rgba(255, 77, 68, 0.88)"};
  color: #fff;
  text-align: center;

  svg {
    width: 42px;
    height: 42px;
    margin: 0 auto;
  }
`;

const PriceChart = styled.div<{ $isDown: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: end;
  min-height: 280px;
  padding: 18px 30px 20px;
  background: var(--ground);

  html[data-theme="dark"] & {
    background: #0b1210;
  }

  .mock-price-chart {
    color: ${({ $isDown }) => ($isDown ? "var(--coral)" : "var(--success)")};
  }

  .chart-empty {
    display: grid;
    min-height: 190px;
    place-items: center;
    color: var(--muted);
    font-size: 13px;
  }

  .chart-plot {
    position: relative;
    min-height: 190px;
    margin-top: 14px;
    padding-right: 48px;
  }

  .chart-plot .mock-price-chart {
    width: 100%;
    height: 190px;
    min-height: 0;
    margin-top: 0;
  }

  .chart-prices {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2px 0 4px;
    color: var(--muted);
    font-size: 10px;
    line-height: 1;
    text-align: right;
  }
`;

const ChartPeriodButton = styled.button<{ $selected: boolean }>`
  min-height: 34px;
  border: 0;
  border-radius: 999px;
  background: ${({ $selected }) => ($selected ? "var(--acid)" : "transparent")};
  color: ${({ $selected }) => ($selected ? "#07110d" : "var(--muted)")};
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
`;

const MarketChange = styled.strong<{ $positive: boolean }>`
  color: ${({ $positive }) => ($positive ? "var(--success)" : "var(--coral)")};
`;

const RiskLabel = styled.span<{ $risk: FeedItem["riskLabel"] }>`
  color: ${({ $risk }) =>
    $risk === "higher"
      ? "var(--coral)"
      : $risk === "medium"
        ? "var(--warning)"
        : "var(--success)"};
`;

function chartPoints(chart: MarketChartResponse) {
  const prices = chart.points.map((point) => point.priceUsd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || Math.max(max * 0.02, 0.01);

  return chart.points
    .map((point, index) => {
      const x = (index / Math.max(chart.points.length - 1, 1)) * 640;
      const y = 210 - ((point.priceUsd - min) / range) * 170;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function chartPriceTicks(prices: number[]) {
  if (!prices.length) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const interval = (max - min) / 3;
  return Array.from({ length: 4 }, (_, index) => max - interval * index);
}

function formatChartAxisPrice(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)}`;
}

function chartDateLabel(timestamp: string, period: MarketChartPeriod) {
  const date = new Date(timestamp);
  if (period === "1") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(
    "en-US",
    period === "7" || period === "30"
      ? { month: "short", day: "numeric" }
      : { month: "short", year: "numeric" },
  ).format(date);
}

export function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [ticketAmount, setTicketAmount] = useState(10);
  const [chartPeriod, setChartPeriod] = useState<MarketChartPeriod>("30");
  const [chart, setChart] = useState<MarketChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const basket = useBasket();
  const active = feed[index];

  useEffect(() => {
    const controller = new AbortController();
    getFeed(controller.signal)
      .then((response) => setFeed(response.items))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!active?.coingeckoId) {
      setChart(null);
      setChartLoading(false);
      return;
    }

    const controller = new AbortController();
    setChart(null);
    setChartLoading(true);
    getMarketChart(active.id, chartPeriod, controller.signal)
      .then(setChart)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setChart(null);
      })
      .finally(() => setChartLoading(false));
    return () => controller.abort();
  }, [active?.id, active?.coingeckoId, chartPeriod]);

  useEffect(
    () => () => {
      if (feedbackTimer.current !== undefined)
        window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const advance = (invest: boolean) => {
    if (!active || feedback) return;
    if (invest)
      basket.add({
        id: active.id,
        title: active.name,
        kind: "asset",
        amountUsd: ticketAmount,
      });
    setFeedback(invest ? "invest" : "skip");
    feedbackTimer.current = window.setTimeout(() => {
      setIndex((current) => current + 1);
      setFeedback(undefined);
      setDragX(0);
    }, 300);
  };

  const finishPointer = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointerStart.current || pointerStart.current.id !== event.pointerId)
      return;
    const distance = event.clientX - pointerStart.current.x;
    pointerStart.current = null;
    setDragX(0);
    if (Math.abs(distance) >= 72) advance(distance > 0);
  };

  function handleSkip() {
    advance(false);
  }

  function handleAdd() {
    advance(true);
  }

  function handleReview() {
    basket.open();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (
      feedback ||
      (event.target instanceof HTMLElement && event.target.closest("button, a"))
    ) {
      return;
    }

    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!pointerStart.current || pointerStart.current.id !== event.pointerId)
      return;

    setDragX(
      Math.max(-140, Math.min(140, event.clientX - pointerStart.current.x)),
    );
  }

  function handlePointerCancel() {
    pointerStart.current = null;
    setDragX(0);
  }

  function handleTicketAmountChange(amount: number) {
    setTicketAmount(amount);
  }

  const chartPrices = chart?.points.map((point) => point.priceUsd) ?? [];
  const chartTicks = chartPriceTicks(chartPrices);
  const chartFirst = chartPrices[0];
  const chartLast = chartPrices.at(-1);
  const chartChange =
    chartFirst && chartLast
      ? ((chartLast - chartFirst) / chartFirst) * 100
      : null;

  if (error) {
    return (
      <FeedPage>
        <FeedWorkspace>
          <div className="inline-alert" role="alert">
            The catalog is temporarily unavailable. Check that the API is
            running.
          </div>
        </FeedWorkspace>
      </FeedPage>
    );
  }

  return (
    <FeedPage>
      <FeedWorkspace>
        <FeedLayout>
          <FeedMain>
            <FeedHeading>
              <h1>Build your basket</h1>
              <p>Swipe right to add left to skip.</p>
              {!active && feed.length ? (
                <span className="source-note">
                  Feed reviewed. Your basket is ready.
                </span>
              ) : active ? (
                <span className="source-note">
                  {active.marketDataUpdatedAt
                    ? `Market data updated ${relativeTime(active.marketDataUpdatedAt)}`
                    : "Curated asset data"}
                </span>
              ) : null}
            </FeedHeading>

            {loading ? (
              <FeedStatus role="status" aria-live="polite">
                <strong>Building your feed</strong>
                <span>Loading current market positions...</span>
              </FeedStatus>
            ) : active ? (
              <div className="feed-card-stage">
                <button
                  type="button"
                  className="gesture gesture-skip"
                  aria-label={`Skip ${active.name}`}
                  disabled={Boolean(feedback)}
                  onClick={handleSkip}
                >
                  <ChevronLeft aria-hidden="true" />
                  <span>
                    Skip<small>Swipe left</small>
                  </span>
                </button>

                <SwipeCard
                  $feedback={feedback}
                  $dragX={dragX}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishPointer}
                  onPointerCancel={handlePointerCancel}
                >
                  {feedback ? (
                    <DecisionFlash $feedback={feedback} aria-live="polite">
                      {feedback === "invest" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <X aria-hidden="true" />
                      )}
                      <strong>
                        {feedback === "invest" ? "In your basket" : "Skipped"}
                      </strong>
                    </DecisionFlash>
                  ) : null}
                  <div className="card-head">
                    <div className="asset-title">
                      <div className="asset-mark">
                        {active.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h2>{active.symbol}</h2>
                        <p>{active.name}</p>
                      </div>
                    </div>
                    <TicketAmountEditor
                      amount={ticketAmount}
                      onChange={handleTicketAmountChange}
                    />
                  </div>

                  <PriceChart
                    $isDown={
                      active.priceChange24hPct !== null &&
                      active.priceChange24hPct !== undefined &&
                      active.priceChange24hPct < 0
                    }
                  >
                    <div className="chart-meta">
                      <span>
                        {active.priceUsd
                          ? `$${formatUsd(active.priceUsd)}`
                          : "Price unavailable"}
                      </span>
                      <small>{active.marketDataSource}</small>
                    </div>
                    {chartLoading ? (
                      <div className="chart-empty">Loading chart...</div>
                    ) : chart?.points.length ? (
                      <div className="chart-plot">
                        <svg
                          className="mock-price-chart"
                          viewBox="0 0 640 260"
                          role="img"
                          aria-label={`${active.name} price chart`}
                        >
                          {[38, 92, 146, 200].map((y) => (
                            <line
                              key={y}
                              className="chart-gridline"
                              x1="0"
                              x2="640"
                              y1={y}
                              y2={y}
                            />
                          ))}
                          <polygon
                            points={`${chartPoints(chart)} 640,230 0,230`}
                          />
                          <polyline points={chartPoints(chart)} />
                        </svg>
                        <div className="chart-prices" aria-hidden="true">
                          {chartTicks.map((tick) => (
                            <span key={tick}>{formatChartAxisPrice(tick)}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="chart-empty">
                        Historical data unavailable
                      </div>
                    )}
                    <div className="chart-axis-labels">
                      <span>
                        {chart?.points[0]
                          ? chartDateLabel(
                              chart.points[0].timestamp,
                              chartPeriod,
                            )
                          : ""}
                      </span>
                      <span>
                        {chart?.points.at(-1)
                          ? chartDateLabel(
                              chart.points.at(-1)?.timestamp ?? "",
                              chartPeriod,
                            )
                          : ""}
                      </span>
                    </div>
                    <div className="chart-controls">
                      {(
                        [
                          ["1D", "1"],
                          ["1W", "7"],
                          ["1M", "30"],
                          ["1Y", "365"],
                          ["All", "max"],
                        ] as const
                      ).map(([label, period]) => (
                        <ChartPeriodButton
                          key={label}
                          type="button"
                          $selected={chartPeriod === period}
                          aria-pressed={chartPeriod === period}
                          onClick={() => setChartPeriod(period)}
                        >
                          {label}
                        </ChartPeriodButton>
                      ))}
                      <button
                        type="button"
                        className="chart-help"
                        aria-label="About this chart"
                      >
                        ?
                      </button>
                    </div>
                    <div className="chart-footer">
                      <span>
                        {chartPeriod === "max"
                          ? "All time"
                          : chartPeriod === "1"
                            ? "1D"
                            : chartPeriod === "7"
                              ? "1W"
                              : chartPeriod === "30"
                                ? "1M"
                                : "1Y"}{" "}
                        signal
                      </span>
                      {chartChange !== null ? (
                        <MarketChange $positive={chartChange >= 0}>
                          {chartChange >= 0 ? "+" : ""}
                          {chartChange.toFixed(2)}%
                        </MarketChange>
                      ) : (
                        <strong>Awaiting live data</strong>
                      )}
                    </div>
                  </PriceChart>

                  <div className="swipe-card-copy">
                    <RiskLabel $risk={active.riskLabel}>
                      {active.riskLabel} risk
                    </RiskLabel>
                    <p>{active.rationale}</p>
                    <small>Source: {active.sourceLabel}</small>
                  </div>
                </SwipeCard>

                <button
                  type="button"
                  className="gesture gesture-add"
                  aria-label={`Add ${active.name} to basket`}
                  disabled={Boolean(feedback)}
                  onClick={handleAdd}
                >
                  <span>
                    Add<small>Swipe right</small>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="feed-complete">
                <Check aria-hidden="true" />
                <h2>Feed reviewed.</h2>
                <p>
                  {basket.count
                    ? `${basket.count} selection${basket.count === 1 ? "" : "s"} ready for your basket.`
                    : "Your basket is still empty."}
                </p>
                <button
                  type="button"
                  className="legacy-primary-button"
                  disabled={!basket.count}
                  onClick={handleReview}
                >
                  <Plus aria-hidden="true" /> Review basket
                </button>
              </div>
            )}

            <div className="feed-card-actions">
              <button
                type="button"
                className="feed-action feed-action-skip"
                onClick={handleSkip}
                disabled={!active || Boolean(feedback)}
              >
                <ChevronLeft aria-hidden="true" /> Skip
              </button>
              <button
                type="button"
                className="feed-action feed-action-review"
                onClick={handleReview}
                disabled={!basket.count}
              >
                Review basket ({basket.count}){" "}
                <BaggageClaim aria-hidden="true" />
              </button>
              <button
                type="button"
                className="feed-action feed-action-add"
                onClick={handleAdd}
                disabled={!active || Boolean(feedback)}
              >
                Add {ticketAmount} USDC <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </FeedMain>
          <BasketRail />
        </FeedLayout>
      </FeedWorkspace>
    </FeedPage>
  );
}

function relativeTime(value: string) {
  const ageSeconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 1_000),
  );
  if (ageSeconds < 10) return "just now";
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function TicketAmountEditor({
  amount,
  onChange,
}: {
  amount: number;
  onChange: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(amount));

  useEffect(() => {
    if (!editing) setDraft(String(amount));
  }, [amount, editing]);

  function finish() {
    const next = Number(draft);
    if (Number.isFinite(next) && next >= 0.1 && next <= 100) {
      onChange(Math.round(next * 100) / 100);
    } else {
      setDraft(String(amount));
    }
    setEditing(false);
  }

  function handleDraftChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") finish();
    if (event.key === "Escape") {
      setDraft(String(amount));
      setEditing(false);
    }
  }

  function handleStartEditing() {
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="allocation-stamp allocation-amount-editor is-editing">
        <span>$</span>
        <input
          type="number"
          min="0.1"
          max="100"
          step="0.01"
          inputMode="decimal"
          value={draft}
          aria-label="Basket ticket amount in USDC"
          onChange={handleDraftChange}
          onBlur={finish}
          onKeyDown={handleDraftKeyDown}
        />
        <WandSparkles aria-hidden="true" />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="allocation-stamp allocation-amount-editor"
      aria-label={`Edit basket ticket amount, currently ${amount} dollars`}
      onClick={handleStartEditing}
    >
      <span>$</span>
      <strong>{amount}</strong>
      <WandSparkles aria-hidden="true" />
    </button>
  );
}
