import type { FeedItem } from "@invest4fun/contracts";
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
import { BasketRail } from "../components/basket/BasketRail";
import { getFeed } from "../services/api";
import { useBasket } from "../state/basket-context";

type Feedback = "invest" | "skip";

export function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [index, setIndex] = useState(0);
  const [ticketAmount, setTicketAmount] = useState(10);
  const [feedback, setFeedback] = useState<Feedback>();
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const basket = useBasket();

  useEffect(() => {
    const controller = new AbortController();
    getFeed(controller.signal)
      .then((response) => setFeed(response.items))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimer.current !== undefined)
        window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const active = feed[index];
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

  if (error) {
    return (
      <main className="legacy-page feed-page">
        <section className="feed-workspace">
          <div className="inline-alert" role="alert">
            The catalog is temporarily unavailable. Check that the API is
            running.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="legacy-page feed-page">
      <section className="feed-workspace">
        <div className="feed-layout">
          <div className="feed-main">
            <header className="page-heading feed-heading">
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
            </header>

            {active ? (
              <div className="feed-card-stage">
                <button
                  type="button"
                  className="gesture gesture-skip"
                  aria-label={`Skip ${active.name}`}
                  disabled={Boolean(feedback)}
                  onClick={() => advance(false)}
                >
                  <ChevronLeft aria-hidden="true" />
                  <span>
                    Skip<small>Swipe left</small>
                  </span>
                </button>

                <article
                  className={`swipe-card${feedback ? ` is-${feedback}` : ""}`}
                  style={{
                    transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
                  }}
                  onPointerDown={(event) => {
                    if (
                      feedback ||
                      (event.target as HTMLElement).closest("button, a")
                    )
                      return;
                    pointerStart.current = {
                      id: event.pointerId,
                      x: event.clientX,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (
                      !pointerStart.current ||
                      pointerStart.current.id !== event.pointerId
                    )
                      return;
                    setDragX(
                      Math.max(
                        -140,
                        Math.min(140, event.clientX - pointerStart.current.x),
                      ),
                    );
                  }}
                  onPointerUp={finishPointer}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                    setDragX(0);
                  }}
                >
                  {feedback ? (
                    <div
                      className={`card-decision-flash ${feedback}`}
                      aria-live="polite"
                    >
                      {feedback === "invest" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <X aria-hidden="true" />
                      )}
                      <strong>
                        {feedback === "invest" ? "In your basket" : "Skipped"}
                      </strong>
                    </div>
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
                      onChange={setTicketAmount}
                    />
                  </div>

                  <div
                    className={`price-chart${active.priceChange24hPct !== null && active.priceChange24hPct !== undefined && active.priceChange24hPct < 0 ? " is-down" : ""}`}
                  >
                    <div className="chart-meta">
                      <span>
                        {active.priceUsd
                          ? `$${formatUsd(active.priceUsd)}`
                          : "Price unavailable"}
                      </span>
                      <small>{active.marketDataSource}</small>
                    </div>
                    <svg
                      className="mock-price-chart"
                      viewBox="0 0 640 260"
                      role="img"
                      aria-label="Mock one month price chart"
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
                      <polygon points="0,86 28,124 55,101 83,137 111,89 140,116 168,72 196,142 224,132 252,171 280,158 308,203 336,183 364,190 392,148 420,165 448,126 476,151 504,119 532,132 560,103 588,120 616,90 640,104 640,230 0,230" />
                      <polyline points="0,86 28,124 55,101 83,137 111,89 140,116 168,72 196,142 224,132 252,171 280,158 308,203 336,183 364,190 392,148 420,165 448,126 476,151 504,119 532,132 560,103 588,120 616,90 640,104" />
                    </svg>
                    <div className="chart-axis-labels">
                      <span>Jul 17</span>
                      <span>Aug 16</span>
                    </div>
                    <div className="chart-controls">
                      {(["1D", "1W", "1M", "1Y", "All"] as const).map(
                        (period) => (
                          <button
                            key={period}
                            type="button"
                            className={period === "1M" ? "selected" : ""}
                            aria-pressed={period === "1M"}
                          >
                            {period}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        className="chart-help"
                        aria-label="About this chart"
                      >
                        ?
                      </button>
                    </div>
                    <div className="chart-footer">
                      <span>Market signal</span>
                      {active.priceChange24hPct !== null &&
                      active.priceChange24hPct !== undefined ? (
                        <strong
                          className={
                            active.priceChange24hPct >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {active.priceChange24hPct >= 0 ? "+" : ""}
                          {active.priceChange24hPct.toFixed(2)}% today
                        </strong>
                      ) : (
                        <strong>Awaiting live data</strong>
                      )}
                    </div>
                  </div>

                  <div className="swipe-card-copy">
                    <span className={`risk-label ${active.riskLabel}`}>
                      {active.riskLabel} risk
                    </span>
                    <p>{active.rationale}</p>
                    <small>Source: {active.sourceLabel}</small>
                  </div>
                </article>

                <button
                  type="button"
                  className="gesture gesture-add"
                  aria-label={`Add ${active.name} to basket`}
                  disabled={Boolean(feedback)}
                  onClick={() => advance(true)}
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
                  onClick={basket.open}
                >
                  <Plus aria-hidden="true" /> Review basket
                </button>
              </div>
            )}

            <div className="feed-card-actions">
              <button
                type="button"
                className="feed-action feed-action-skip"
                onClick={() => advance(false)}
                disabled={!active || Boolean(feedback)}
              >
                <ChevronLeft aria-hidden="true" /> Skip
              </button>
              <button
                type="button"
                className="feed-action feed-action-review"
                onClick={basket.open}
                disabled={!basket.count}
              >
                Review basket ({basket.count}){" "}
                <BaggageClaim aria-hidden="true" />
              </button>
              <button
                type="button"
                className="feed-action feed-action-add"
                onClick={() => advance(true)}
                disabled={!active || Boolean(feedback)}
              >
                Add {ticketAmount} USDC <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>
          <BasketRail />
        </div>
      </section>
    </main>
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
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finish}
          onKeyDown={(event) => {
            if (event.key === "Enter") finish();
            if (event.key === "Escape") {
              setDraft(String(amount));
              setEditing(false);
            }
          }}
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
      onClick={() => setEditing(true)}
    >
      <span>$</span>
      <strong>{amount}</strong>
      <WandSparkles aria-hidden="true" />
    </button>
  );
}
