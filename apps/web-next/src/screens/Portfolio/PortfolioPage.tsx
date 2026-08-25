import { ROUTES } from "@src/app/routes/routes";
import { useStores } from "@src/stores";
import { BriefcaseBusiness, LogIn, Plus, Wallet } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Page = styled.main`
  width: min(980px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 0;
`;

const Heading = styled.header`
  max-width: 720px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  h1 {
    margin: 8px 0 12px;
    font-size: clamp(2.8rem, 8vw, 5.8rem);
    line-height: 0.92;
    letter-spacing: -0.07em;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Summary = styled.section`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: clamp(22px, 5vw, 38px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.card};

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Value = styled.div`
  display: grid;
  gap: 8px;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    font-size: clamp(2.2rem, 6vw, 4rem);
    letter-spacing: -0.06em;
  }
`;

const WalletStatus = styled.div`
  display: grid;
  max-width: 420px;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  code {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const EmptyPositions = styled.section`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: clamp(22px, 5vw, 32px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};

  > svg {
    width: 30px;
    height: 30px;
    color: ${({ theme }) => theme.colors.accent};
  }

  p {
    margin: 5px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  @media (max-width: 640px) {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.canvas};
  font-weight: 700;
  cursor: pointer;
`;

export const PortfolioPage = observer(function PortfolioPage() {
  const { accountStore } = useStores();
  const navigate = useNavigate();
  const wallet = accountStore.portfolioWallet;

  function handleAction() {
    if (accountStore.configured && !accountStore.authenticated) {
      accountStore.login();
      return;
    }

    navigate(ROUTES.IDEAS);
  }

  return (
    <Page>
      <Heading>
        <span>Invest4Fun wallet</span>
        <h1>Portfolio</h1>
        <p>
          Only supported assets held in your embedded Invest4Fun wallet belong
          to this portfolio. External wallets remain separate.
        </p>
      </Heading>

      <Summary>
        <Value>
          <span>Total portfolio value</span>
          <strong>—</strong>
        </Value>
        <WalletStatus>
          <strong>
            <Wallet size={16} aria-hidden="true" /> Embedded wallet
          </strong>
          {wallet ? (
            <code>{wallet.address}</code>
          ) : accountStore.authenticated ? (
            <span>Wallet setup is still pending.</span>
          ) : (
            <span>Sign in to restore your Invest4Fun wallet.</span>
          )}
          <small>
            Live balances and valuation will appear when the portfolio API is
            connected.
          </small>
        </WalletStatus>
      </Summary>

      <EmptyPositions>
        <BriefcaseBusiness aria-hidden="true" />
        <div>
          <strong>No confirmed positions yet</strong>
          <p>
            Confirmed holdings and their Idea attribution will appear here after
            settlement and reconciliation.
          </p>
        </div>
        <ActionButton type="button" onClick={handleAction}>
          {accountStore.configured && !accountStore.authenticated ? (
            <>
              <LogIn size={17} /> Sign in
            </>
          ) : (
            <>
              <Plus size={17} /> Build a basket
            </>
          )}
        </ActionButton>
      </EmptyPositions>
    </Page>
  );
});
