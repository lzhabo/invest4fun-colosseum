import { BriefcaseBusiness, Plus } from "lucide-react";
import styled from "styled-components";

const PortfolioPage = styled.main`
  min-height: calc(100dvh - 74px);
  padding: 42px 38px 128px;
  background: var(--ground);
`;

const PageHeading = styled.header`
  max-width: 760px;
  margin: 0 auto 34px;

  > span {
    color: var(--blue);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0 12px;
    font: 48px / 0.98 var(--font-brand);
  }

  p {
    max-width: 650px;
    margin: 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.5;
  }

  @media (max-width: 900px) {
    h1 {
      font-size: 40px;
    }
  }

  @media (max-width: 520px) {
    h1 {
      font-size: 34px;
    }
  }
`;

const Summary = styled.section`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  max-width: 980px;
  margin: 0 auto 22px;
  padding: 24px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--paper);
`;

const SummaryValue = styled.div`
  display: grid;
  gap: 8px;

  span {
    color: var(--blue);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    font: 32px / 1 var(--font-brand);
  }
`;

const SummaryNote = styled.p`
  max-width: 360px;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
  text-align: right;
`;

const EmptyPositions = styled.section`
  max-width: 980px;
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0 auto;
  padding: 26px 24px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--paper);

  > svg {
    width: 28px;
    height: 28px;
    color: var(--blue);
  }

  > div {
    flex: 1;
  }

  strong {
    font-size: 18px;
  }

  p {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 13px;
  }

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 0 14px;
  background: var(--acid);
  color: var(--ink);
  cursor: pointer;
  font-weight: 800;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export function PortfolioScreen() {
  return (
    <PortfolioPage>
      <PageHeading>
        <span>Invest4Fun wallet</span>
        <h1>Portfolio</h1>
        <p>Only assets held in the Invest4Fun wallet are shown here.</p>
      </PageHeading>
      <Summary>
        <SummaryValue>
          <span>Total portfolio value</span>
          <strong>$0.00</strong>
        </SummaryValue>
        <SummaryNote>
          Portfolio data will appear after a confirmed investment settles
          onchain.
        </SummaryNote>
      </Summary>
      <EmptyPositions>
        <BriefcaseBusiness aria-hidden="true" />
        <div>
          <strong>No positions yet</strong>
          <p>Your confirmed assets and Idea attribution will appear here.</p>
        </div>
        <PrimaryButton type="button">
          <Plus aria-hidden="true" /> Build a basket
        </PrimaryButton>
      </EmptyPositions>
    </PortfolioPage>
  );
}
