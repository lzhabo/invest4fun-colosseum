import { AssetCard } from "@src/components/AssetCard";
import { BasketSummary } from "@src/components/BasketSummary";
import { RouteState } from "@src/components/RouteState";
import { useStores } from "@src/stores";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import styled from "styled-components";

const Page = styled.main`
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(40px, 7vw, 80px) 0;
`;

const Heading = styled.header`
  max-width: 700px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  h1 {
    margin: 8px 0 12px;
    font-size: clamp(2.8rem, 8vw, 6rem);
    line-height: 0.9;
    letter-spacing: -0.075em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: clamp(24px, 4vw, 48px);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Stage = styled.section`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 120px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;

    article {
      grid-column: 1 / -1;
      grid-row: 1;
    }
  }
`;

const DecisionButton = styled.button<{ $kind: "skip" | "add" }>`
  display: flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ $kind, theme }) =>
    $kind === "add" ? theme.colors.positive : theme.colors.negative};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 12px 18px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.canvas};
  cursor: pointer;
`;

export const FeedPage = observer(function FeedPage() {
  const { feedStore } = useStores();
  const pointerStart = useRef<{ id: number; x: number } | null>(null);

  useEffect(() => {
    feedStore.initialize();
    return feedStore.dispose;
  }, [feedStore]);

  if (feedStore.status === "idle" || feedStore.status === "loading") {
    return <RouteState title="Loading token feed…" />;
  }

  if (feedStore.status === "error") {
    return (
      <RouteState
        eyebrow="Feed unavailable"
        title="We could not load the token list."
        description="Try loading the mocked feed again."
      >
        <RetryButton type="button" onClick={feedStore.retry}>
          <RotateCcw size={17} /> Retry
        </RetryButton>
      </RouteState>
    );
  }

  const activeItem = feedStore.activeItem;

  return (
    <Page>
      <Heading>
        <span>Discover assets</span>
        <h1>Token feed</h1>
        <p>
          Swipe right or choose Add to put $25 of a token in your basket. Market
          values are mocked for this frontend iteration.
        </p>
      </Heading>

      <Workspace>
        {activeItem ? (
          <Stage>
            <DecisionButton
              type="button"
              $kind="skip"
              disabled={Boolean(feedStore.decision)}
              onClick={() => feedStore.decide("skip")}
            >
              <ChevronLeft size={19} /> Skip
            </DecisionButton>
            <AssetCard
              item={activeItem}
              decision={feedStore.decision}
              dragX={feedStore.dragX}
              onPointerDown={(event) => {
                if (feedStore.decision) return;
                pointerStart.current = {
                  id: event.pointerId,
                  x: event.clientX,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (pointerStart.current?.id !== event.pointerId) return;
                feedStore.setDragX(event.clientX - pointerStart.current.x);
              }}
              onPointerUp={(event) => {
                if (pointerStart.current?.id !== event.pointerId) return;
                const distance = event.clientX - pointerStart.current.x;
                pointerStart.current = null;
                feedStore.finishDrag(distance);
              }}
              onPointerCancel={() => {
                pointerStart.current = null;
                feedStore.setDragX(0);
              }}
            />
            <DecisionButton
              type="button"
              $kind="add"
              disabled={Boolean(feedStore.decision)}
              onClick={() => feedStore.decide("add")}
            >
              Add <ChevronRight size={19} />
            </DecisionButton>
          </Stage>
        ) : (
          <RouteState
            eyebrow="Feed complete"
            title="You reviewed every token."
            description="Your selections are waiting in the basket."
          >
            <RetryButton type="button" onClick={feedStore.restart}>
              <RotateCcw size={17} /> Start again
            </RetryButton>
          </RouteState>
        )}

        <BasketSummary />
      </Workspace>
    </Page>
  );
});
