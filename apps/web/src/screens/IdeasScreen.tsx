import type { Idea } from "@invest4fun/contracts";
import { Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getIdeas } from "../services/api";

type Feedback = "invest" | "skip";

export function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>();
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    getIdeas(controller.signal)
      .then((response) => setIdeas(response.items))
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

  const active = ideas[index];
  const advance = (invest: boolean) => {
    if (!active || feedback) return;
    if (invest) {
      setSelected((current) =>
        current.includes(active.id) ? current : [...current, active.id],
      );
    }
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
      <main className="legacy-page ideas-page">
        <section className="ideas-workspace">
          <div className="inline-alert" role="alert">
            Ideas are temporarily unavailable. Check that the API is running.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="legacy-page ideas-page">
      <section className="ideas-workspace">
        <header className="page-heading ideas-heading">
          <span className="eyebrow">Prepared compositions</span>
          <h1>Investment ideas</h1>
          <p>Swipe right to add an idea, left to skip it.</p>
        </header>

        {active ? (
          <div className="ideas-card-stage">
            <button
              type="button"
              className="gesture gesture-skip"
              aria-label={`Skip ${active.title}`}
              disabled={Boolean(feedback)}
              onClick={() => advance(false)}
            >
              <ChevronLeft aria-hidden="true" />
              <span>
                Skip<small>Swipe left</small>
              </span>
            </button>

            <article
              className={`idea-swipe-card${feedback ? ` is-${feedback}` : ""}`}
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
              <div className="idea-card-header">
                <div className="legacy-idea-icon" aria-hidden="true">
                  <Lightbulb />
                </div>
                <div>
                  <div className="legacy-card-meta">
                    <span>{active.riskLabel} risk</span>
                    <span>{active.positions.length} assets</span>
                  </div>
                  <h2>{active.title}</h2>
                </div>
              </div>
              <div className="idea-card-visual">
                <div className="idea-allocation-ring" aria-hidden="true">
                  <span>
                    {Math.round((active.positions.length / 5) * 100)}%
                  </span>
                  <small>curated mix</small>
                </div>
                <div className="idea-allocation-bars" aria-hidden="true">
                  {active.positions.map((position, positionIndex) => (
                    <i
                      key={position.symbol}
                      style={{
                        width: `${100 / active.positions.length}%`,
                        opacity: `${1 - positionIndex * 0.08}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="idea-card-copy">
                <p>{active.description}</p>
                <div className="idea-position-list">
                  {active.positions.map((position) => (
                    <span key={position.symbol}>{position.symbol}</span>
                  ))}
                </div>
                <small>
                  Prepared idea · allocation details will be shown at review.
                </small>
              </div>
            </article>

            <button
              type="button"
              className="gesture gesture-add"
              aria-label={`Add ${active.title} to basket`}
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
            <h2>Ideas reviewed.</h2>
            <p>
              {selected.length
                ? `${selected.length} idea${selected.length === 1 ? "" : "s"} ready for your basket.`
                : "Your basket is still empty."}
            </p>
            <button
              type="button"
              className="legacy-primary-button"
              disabled={!selected.length}
            >
              Review basket
            </button>
          </div>
        )}

        <div className="legacy-basket-bar">
          <div>
            <span>Basket</span>
            <strong>
              {selected.length
                ? `${selected.length} ideas selected`
                : "Your basket is empty"}
            </strong>
          </div>
          <button
            type="button"
            className="legacy-primary-button"
            disabled={!selected.length}
          >
            Review basket <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
