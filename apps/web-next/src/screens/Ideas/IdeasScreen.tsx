import { IdeaCard } from "@src/components/IdeaCard";
import { RouteState } from "@src/components/RouteState";
import { useIdeasVM } from "@src/screens/Ideas/IdeasVMProvider";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import styled from "styled-components";

const Page = styled.main`
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 0;
`;

const Heading = styled.header`
  max-width: 700px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  h1 {
    margin: 8px 0 12px;
    font-size: clamp(2.6rem, 8vw, 5.8rem);
    line-height: 0.92;
    letter-spacing: -0.07em;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Stage = styled.section`
  display: grid;
  grid-template-columns: 150px minmax(0, 620px) 150px;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 860px) {
    grid-template-columns: 1fr 1fr;

    article {
      grid-column: 1 / -1;
      grid-row: 1;
    }
  }
`;

const DecisionButton = styled.button<{ $kind: "skip" | "invest" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ $kind, theme }) =>
    $kind === "invest" ? theme.colors.positive : theme.colors.negative};
  font: inherit;
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
  margin: 24px auto 0;
  padding: 12px 18px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.canvas};
  cursor: pointer;
`;

export const IdeasScreen = observer(function IdeasScreen() {
  const vm = useIdeasVM();
  const state = vm.getState();
  const pointerStart = useRef<{ id: number; x: number } | undefined>(undefined);

  if (state.status === "idle" || state.status === "loading") {
    return <RouteState title="Loading prepared ideas…" />;
  }

  if (state.status === "error") {
    return (
      <RouteState
        eyebrow="Ideas unavailable"
        title="We could not load this collection."
        description="Check the API connection and try again."
      >
        <RetryButton type="button" onClick={() => vm.retry()}>
          <RotateCcw size={17} /> Retry
        </RetryButton>
      </RouteState>
    );
  }

  const activeIdea = vm.activeIdea;

  return (
    <Page>
      <Heading>
        <span>Prepared compositions</span>
        <h1>Investment ideas</h1>
        <p>Swipe right to add an idea, or left to skip it.</p>
      </Heading>
      {activeIdea ? (
        <Stage>
          <DecisionButton
            type="button"
            $kind="skip"
            disabled={Boolean(state.decision)}
            onClick={() => vm.decide("skip")}
          >
            <ChevronLeft size={19} /> Skip
          </DecisionButton>
          <IdeaCard
            idea={activeIdea}
            decision={state.decision}
            dragX={state.dragX}
            onPointerDown={(event) => {
              if (state.decision) return;
              pointerStart.current = { id: event.pointerId, x: event.clientX };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (pointerStart.current?.id !== event.pointerId) return;
              vm.setDragX(event.clientX - pointerStart.current.x);
            }}
            onPointerUp={(event) => {
              if (pointerStart.current?.id !== event.pointerId) return;
              const distance = event.clientX - pointerStart.current.x;
              pointerStart.current = undefined;
              vm.finishDrag(distance);
            }}
            onPointerCancel={() => {
              pointerStart.current = undefined;
              vm.setDragX(0);
            }}
          />
          <DecisionButton
            type="button"
            $kind="invest"
            disabled={Boolean(state.decision)}
            onClick={() => vm.decide("invest")}
          >
            Add <ChevronRight size={19} />
          </DecisionButton>
        </Stage>
      ) : (
        <RouteState
          eyebrow="Collection complete"
          title="Ideas reviewed."
          description="Your selections are saved in the basket."
        />
      )}
    </Page>
  );
});
