import type { FeedItem } from "@invest4fun/contracts";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFeed } from "../services/api";
import { useBasket } from "../state/basket-context";

type Feedback = "invest" | "skip";

export function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [index, setIndex] = useState(0);
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
      basket.add({ id: active.id, title: active.name, kind: "asset" });
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
        <header className="page-heading feed-heading">
          <span className="eyebrow">Personalized market feed</span>
          <h1>What are you investing in?</h1>
          <p>Swipe right to add an asset to your basket, left to skip.</p>
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
                  <div className="asset-mark">{active.symbol.slice(0, 2)}</div>
                  <div>
                    <h2>{active.symbol}</h2>
                    <p>{active.name}</p>
                  </div>
                </div>
                <div className="allocation-stamp">
                  <span>$</span>
                  <strong>50</strong>
                  <small>ticket</small>
                </div>
              </div>

              <div className="price-chart">
                <div className="chart-meta">
                  <span>
                    {active.priceUsd
                      ? `$${formatUsd(active.priceUsd)}`
                      : "Price unavailable"}
                  </span>
                  <small>{active.marketDataSource}</small>
                </div>
                <div className="chart-bars" aria-hidden="true">
                  {[32, 48, 38, 64, 55, 78, 67, 92, 84, 100].map((height) => (
                    <i key={`bar-${height}`} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="chart-footer">
                  <span>Market signal</span>
                  {active.priceChange24hPct !== null &&
                  active.priceChange24hPct !== undefined ? (
                    <strong
                      className={
                        active.priceChange24hPct >= 0 ? "positive" : "negative"
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

        <div className="legacy-basket-bar">
          <div>
            <span>Basket</span>
            <strong>
              {basket.count
                ? `${basket.count} selections ready`
                : "Your basket is empty"}
            </strong>
          </div>
          <button
            type="button"
            className="legacy-primary-button"
            disabled={!basket.count}
            onClick={basket.open}
          >
            Review basket <Plus aria-hidden="true" />
          </button>
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
