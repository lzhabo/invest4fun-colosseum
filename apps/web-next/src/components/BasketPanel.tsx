import { useStores } from "@src/stores";
import { ShoppingBasket, Trash2, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

const Panel = styled.aside`
  position: fixed;
  z-index: 20;
  top: 80px;
  right: ${({ theme }) => theme.spacing.lg};
  width: min(380px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.floating};
`;

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Entry = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  padding: 14px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const IconButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
`;

export const BasketPanel = observer(function BasketPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { basketStore } = useStores();

  return (
    <Panel aria-label="Investment basket">
      <Heading>
        <span>
          <ShoppingBasket size={18} aria-hidden="true" />{" "}
          <strong>Your basket</strong>
        </span>
        <IconButton type="button" aria-label="Close basket" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </Heading>
      {basketStore.entries.length === 0 ? (
        <p>Your selected ideas will appear here.</p>
      ) : (
        basketStore.entries.map((entry) => (
          <Entry key={`${entry.kind}:${entry.id}`}>
            <strong>{entry.title}</strong>
            <IconButton
              type="button"
              aria-label={`Remove ${entry.title}`}
              onClick={() => basketStore.remove(entry.id, entry.kind)}
            >
              <Trash2 size={16} />
            </IconButton>
            <small>${entry.amountUsd.toLocaleString()}</small>
          </Entry>
        ))
      )}
    </Panel>
  );
});
