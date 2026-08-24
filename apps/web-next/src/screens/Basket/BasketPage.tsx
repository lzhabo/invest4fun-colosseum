import { ROUTES } from "@src/app/routes/routes";
import { useStores } from "@src/stores";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Page = styled.main`
  width: min(1540px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(360px, 1fr);
  gap: 14px;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  min-width: 0;
  padding: clamp(24px, 3vw, 34px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`;

const Heading = styled.header`
  h1 {
    margin: 0 0 10px;
    font-size: clamp(2.4rem, 5vw, 4.1rem);
    line-height: 0.95;
    letter-spacing: -0.065em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
  }
`;

const Notice = styled.div`
  margin: 24px 0 30px;
  padding: 15px 16px;
  border: 1px solid #e7b94d;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: #fff8df;
  color: #80600b;
  font-weight: 700;
`;

const Table = styled.div`
  overflow-x: auto;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(120px, 1fr) repeat(3, minmax(90px, 1fr)) 48px;
  min-width: 740px;
`;

const TableHeader = styled(TableRow)`
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.78rem;
  font-weight: 700;
`;

const Entry = styled(TableRow)`
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Asset = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.ink};
    color: white;
    font-size: 0.72rem;
    font-weight: 800;
  }

  strong,
  small {
    display: block;
  }

  small {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: capitalize;
  }
`;

const MutedValue = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const RemoveButton = styled.button`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.negative};
  }
`;

const Totals = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 26px;

  div {
    min-height: 90px;
    padding: 6px 16px;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }

  div:last-child {
    border-right: 0;
  }

  span,
  strong,
  small {
    display: block;
  }

  span,
  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    margin: 9px 0 4px;
    font-size: clamp(1.5rem, 4vw, 2.4rem);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;

    div {
      min-height: 0;
      padding: 14px 0;
      border-right: 0;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`;

const Empty = styled.div`
  padding: 70px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

const SideHeading = styled.h2`
  margin: 0 0 22px;
  font-size: 1.3rem;
`;

const CheckRow = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 48px;

  svg[data-status="ok"] {
    color: ${({ theme }) => theme.colors.positive};
  }

  svg[data-status="warning"] {
    color: #c69217;
  }

  strong {
    font-size: 0.9rem;
  }

  span {
    color: ${({ theme }) => theme.colors.accent};
    font-size: 0.85rem;
    text-align: right;
  }
`;

const Divider = styled.hr`
  margin: 18px 0 24px;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Metadata = styled.dl`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px 20px;
  margin: 0;
  font-size: 0.85rem;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-weight: 700;
    text-align: right;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  gap: 10px;
  margin-top: 24px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
  text-decoration: none;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.positive};
  color: white;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

export const BasketPage = observer(function BasketPage() {
  const { basketStore } = useStores();
  const withinMockBudget = basketStore.totalUsd <= 100;

  return (
    <Page>
      <Grid>
        <Panel>
          <Heading>
            <h1>Review your basket</h1>
            <p>
              No transaction is prepared yet. Backend quotes and wallet balances
              are not connected in this frontend iteration.
            </p>
          </Heading>
          <Notice>
            This preview uses locally saved basket data. No transaction will be
            sent.
          </Notice>

          {basketStore.entries.length > 0 ? (
            <>
              <Table>
                <TableHeader aria-hidden="true">
                  <span>Asset</span>
                  <span>Input (you pay)</span>
                  <span>Estimated output</span>
                  <span>Minimum output</span>
                  <span>Impact</span>
                  <span />
                </TableHeader>
                {basketStore.entries.map((entry) => (
                  <Entry key={`${entry.kind}:${entry.id}`}>
                    <Asset>
                      <span>{assetInitials(entry.title)}</span>
                      <div>
                        <strong>{entry.title}</strong>
                        <small>{entry.kind}</small>
                      </div>
                    </Asset>
                    <strong>{entry.amountUsd.toLocaleString()} USDC</strong>
                    <MutedValue>—</MutedValue>
                    <MutedValue>—</MutedValue>
                    <MutedValue>—</MutedValue>
                    <RemoveButton
                      type="button"
                      aria-label={`Remove ${entry.title}`}
                      onClick={() => basketStore.remove(entry.id, entry.kind)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </RemoveButton>
                  </Entry>
                ))}
              </Table>
              <Totals>
                <div>
                  <span>Wallet balance</span>
                  <strong>—</strong>
                  <small>USDC unavailable</small>
                </div>
                <div>
                  <span>Total input</span>
                  <strong>{basketStore.totalUsd.toLocaleString()}</strong>
                  <small>USDC to invest</small>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>—</strong>
                  <small>Balance required</small>
                </div>
              </Totals>
            </>
          ) : (
            <Empty>Your basket is empty. Return to Feed to add tokens.</Empty>
          )}
        </Panel>

        <Panel>
          <SideHeading>Policy checks</SideHeading>
          <PolicyRow
            status={basketStore.count > 0 ? "ok" : "warning"}
            label="Basket entries valid"
            value={
              basketStore.count > 0
                ? `${basketStore.count} / ${basketStore.count}`
                : "No entries"
            }
          />
          <PolicyRow
            status="warning"
            label="Preview not requested"
            value="Backend required"
          />
          <PolicyRow
            status={withinMockBudget ? "ok" : "warning"}
            label="Local budget within limit"
            value={`${basketStore.totalUsd.toLocaleString()} / 100 USDC`}
          />
          <PolicyRow
            status="warning"
            label="Execution provider"
            value="Not connected"
          />
          <PolicyRow status="ok" label="Network" value="Solana" />
          <PolicyRow
            status="warning"
            label="Live execution"
            value="Not available"
          />

          <Divider />
          <SideHeading>Personal feed ranking</SideHeading>
          <Metadata>
            <dt>Ranking model</dt>
            <dd>mock-feed-v1</dd>
            <dt>Provider</dt>
            <dd>Local fixture</dd>
            <dt>API status</dt>
            <dd>Not connected</dd>
            <dt>Basket persistence</dt>
            <dd>Local storage</dd>
          </Metadata>

          <Actions>
            <BackLink to={ROUTES.FEED}>
              <ArrowLeft size={17} aria-hidden="true" /> Back to cards
            </BackLink>
            <RefreshButton
              type="button"
              disabled
              title="Connect the basket quote API first"
            >
              Refresh quotes <RotateCcw size={18} aria-hidden="true" />
            </RefreshButton>
          </Actions>
        </Panel>
      </Grid>
    </Page>
  );
});

function PolicyRow({
  status,
  label,
  value,
}: {
  status: "ok" | "warning";
  label: string;
  value: string;
}) {
  const Icon = status === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <CheckRow>
      <Icon data-status={status} size={20} aria-hidden="true" />
      <strong>{label}</strong>
      <span>{value}</span>
    </CheckRow>
  );
}

function assetInitials(title: string): string {
  return title.split(" · ")[0]?.slice(0, 4) ?? "Asset";
}
