import type { Idea } from "@invest4fun/contracts";
import type { IdeasDecision } from "@src/screens/Ideas/IdeasVM";
import { Check, Lightbulb, X } from "lucide-react";
import type { PointerEventHandler } from "react";
import styled from "styled-components";

const Card = styled.article<{ $dragX: number }>`
  position: relative;
  overflow: hidden;
  min-height: 520px;
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

const Meta = styled.div`
  display: flex;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Title = styled.h2`
  margin: 18px 0 10px;
  font-size: clamp(2rem, 6vw, 3.7rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
`;

const Allocation = styled.div`
  display: grid;
  gap: 10px;
  margin: 36px 0;
`;

const AllocationRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 48px;
  align-items: center;
  gap: 10px;
`;

const Track = styled.i`
  display: block;
  overflow: hidden;
  height: 9px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Fill = styled.i<{ $width: number }>`
  display: block;
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.accent};
`;

const Decision = styled.div<{ $decision: IdeasDecision }>`
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 12px;
  background: ${({ $decision, theme }) =>
    $decision === "invest" ? theme.colors.positive : theme.colors.negative};
  color: white;
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    margin: auto;
  }
`;

export function IdeaCard({
  idea,
  decision,
  dragX,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  idea: Idea;
  decision: IdeasDecision | undefined;
  dragX: number;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
  onPointerCancel: PointerEventHandler<HTMLElement>;
}) {
  return (
    <Card
      $dragX={dragX}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {decision ? (
        <Decision $decision={decision} aria-live="polite">
          {decision === "invest" ? <Check /> : <X />}
          <strong>
            {decision === "invest" ? "In your basket" : "Skipped"}
          </strong>
        </Decision>
      ) : null}
      <Lightbulb size={32} aria-hidden="true" />
      <Meta>
        <span>{idea.riskLabel} risk</span>
        <span>·</span>
        <span>{idea.version.components.length} assets</span>
      </Meta>
      <Title>{idea.title}</Title>
      {idea.subtitle ? <p>{idea.subtitle}</p> : null}
      <Allocation aria-label="Idea allocation">
        {idea.version.components.map((component) => (
          <AllocationRow key={component.assetId}>
            <strong>{component.symbol}</strong>
            <Track aria-hidden="true">
              <Fill $width={component.weightBps / 100} />
            </Track>
            <span>{component.weightBps / 100}%</span>
          </AllocationRow>
        ))}
      </Allocation>
      <p>{idea.description}</p>
      <small>
        {idea.source.label} · minimum $
        {(idea.minimumInvestmentCents / 100).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}
      </small>
    </Card>
  );
}
