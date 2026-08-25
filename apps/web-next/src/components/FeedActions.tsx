import { ChevronLeft, ChevronRight, ShoppingBasket } from "lucide-react";
import styled from "styled-components";

const Bar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 620px) {
    gap: 8px;
    padding: 8px;
  }
`;

const ActionButton = styled.button<{ $kind: "skip" | "review" | "add" }>`
  display: inline-flex;
  min-width: 0;
  min-height: 58px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 18px;
  border: 2px solid
    ${({ $kind, theme }) =>
      $kind === "skip"
        ? theme.colors.negative
        : $kind === "review"
          ? theme.colors.border
          : theme.colors.positive};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $kind, theme }) =>
    $kind === "add"
      ? theme.colors.positive
      : $kind === "review"
        ? theme.colors.ink
        : "transparent"};
  color: ${({ $kind, theme }) =>
    $kind === "skip"
      ? theme.colors.negative
      : $kind === "review"
        ? theme.colors.canvas
        : "white"};
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (max-width: 620px) {
    min-height: 48px;
    gap: 4px;
    padding: 0 7px;
    border-radius: ${({ theme }) => theme.radii.sm};
    font-size: 0.75rem;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export function FeedActions({
  basketCount,
  decisionPending,
  onSkip,
  onReview,
  onAdd,
}: {
  basketCount: number;
  decisionPending: boolean;
  onSkip: () => void;
  onReview: () => void;
  onAdd: () => void;
}) {
  return (
    <Bar aria-label="Feed actions">
      <ActionButton
        type="button"
        $kind="skip"
        disabled={decisionPending}
        onClick={onSkip}
      >
        <ChevronLeft aria-hidden="true" /> Skip
      </ActionButton>
      <ActionButton
        type="button"
        $kind="review"
        disabled={basketCount === 0}
        onClick={onReview}
      >
        Review basket ({basketCount})
        <ShoppingBasket aria-hidden="true" />
      </ActionButton>
      <ActionButton
        type="button"
        $kind="add"
        disabled={decisionPending}
        onClick={onAdd}
      >
        Add 10 USDC <ChevronRight aria-hidden="true" />
      </ActionButton>
    </Bar>
  );
}
