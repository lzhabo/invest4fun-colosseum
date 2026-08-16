import type { Idea } from "@invest4fun/contracts";
import { Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getIdeas } from "../services/api";
import { useBasket } from "../state/basket-context";

type Feedback = "invest" | "skip";

const IdeaSwipeCard = styled.article<{
  $feedback: Feedback | undefined;
  $dragX: number;
}>`
  transform: translateX(${({ $dragX }) => $dragX}px)
    rotate(${({ $dragX }) => $dragX / 28}deg);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
`;

const IdeaDecisionFlash = styled.div<{ $feedback: Feedback }>`
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
`;

const AllocationBar = styled.i<{ $width: number; $opacity: number }>`
  width: ${({ $width }) => `${$width}%`};
  opacity: ${({ $opacity }) => $opacity};
`;

export function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>();
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const basket = useBasket();

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
      basket.add({
        id: active.id,
        title: active.title,
        kind: "idea",
        amountUsd: 50,
      });
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

    pointerStart.current = { id: event.pointerId, x: event.clientX };
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
              onClick={handleSkip}
            >
              <ChevronLeft aria-hidden="true" />
              <span>
                Skip<small>Swipe left</small>
              </span>
            </button>

            <IdeaSwipeCard
              className="idea-swipe-card"
              $feedback={feedback}
              $dragX={dragX}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={handlePointerCancel}
            >
              {feedback ? (
                <IdeaDecisionFlash $feedback={feedback} aria-live="polite">
                  {feedback === "invest" ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <X aria-hidden="true" />
                  )}
                  <strong>
                    {feedback === "invest" ? "In your basket" : "Skipped"}
                  </strong>
                </IdeaDecisionFlash>
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
                    <AllocationBar
                      key={position.symbol}
                      $width={100 / active.positions.length}
                      $opacity={1 - positionIndex * 0.08}
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
            </IdeaSwipeCard>

            <button
              type="button"
              className="gesture gesture-add"
              aria-label={`Add ${active.title} to basket`}
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
            <h2>Ideas reviewed.</h2>
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
              Review basket
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
            onClick={handleReview}
          >
            Review basket <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
