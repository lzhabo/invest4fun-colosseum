import { useStores } from "@src/stores";
import { ShoppingBasket, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

const Basket = styled.aside`
  position: sticky;
  top: 96px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    position: static;
  }
`;

const Heading = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 1rem;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.82rem;
  }
`;

const Empty = styled.p`
  margin: 28px 0 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`;

const Entry = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 10px;
  padding: 14px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const RemoveButton = styled.button`
  display: grid;
  width: 32px;
  height: 32px;
  grid-row: 1 / 3;
  grid-column: 2;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.canvas};
    color: ${({ theme }) => theme.colors.negative};
  }
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const BasketSummary = observer(function BasketSummary() {
  const { basketStore } = useStores();

  return (
    <Basket aria-label="Investment basket">
      <Heading>
        <h2>
          <ShoppingBasket size={18} aria-hidden="true" /> Your basket
        </h2>
        <span>{basketStore.count} selected</span>
      </Heading>

      {basketStore.entries.length === 0 ? (
        <Empty>Add a token from the feed. Each selection starts at $25.</Empty>
      ) : (
        basketStore.entries.map((entry) => (
          <Entry key={`${entry.kind}:${entry.id}`}>
            <strong>{entry.title}</strong>
            <small>${entry.amountUsd.toLocaleString()}</small>
            <RemoveButton
              type="button"
              aria-label={`Remove ${entry.title}`}
              onClick={() => basketStore.remove(entry.id, entry.kind)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </RemoveButton>
          </Entry>
        ))
      )}

      {basketStore.entries.length > 0 ? (
        <Total>
          <span>Total</span>
          <strong>${basketStore.totalUsd.toLocaleString()}</strong>
        </Total>
      ) : null}
    </Basket>
  );
});
