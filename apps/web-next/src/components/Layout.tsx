import { ROUTES } from "@src/app/routes/routes";
import { BasketPanel } from "@src/components/BasketPanel";
import { useStores } from "@src/stores";
import {
  Activity,
  BriefcaseBusiness,
  CircleUserRound,
  Lightbulb,
  ShoppingBasket,
  X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { type PropsWithChildren, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.canvas} 92%, transparent);
  backdrop-filter: blur(16px);
`;

const Brand = styled.strong`
  font-size: 1.15rem;
  letter-spacing: -0.04em;
`;

const Navigation = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    text-decoration: none;
  }

  a.active {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }

  @media (max-width: 680px) {
    a span {
      display: none;
    }
  }
`;

const BasketButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.canvas};
  cursor: pointer;
`;

export const Layout = observer(function Layout({
  children,
}: PropsWithChildren) {
  const { basketStore } = useStores();
  const [basketOpen, setBasketOpen] = useState(false);

  return (
    <Page>
      <Header>
        <Brand>Invest4Fun</Brand>
        <Navigation aria-label="Primary navigation">
          <NavLink to={ROUTES.IDEAS}>
            <Lightbulb size={18} aria-hidden="true" /> <span>Ideas</span>
          </NavLink>
          <NavLink to={ROUTES.ACTIVITY}>
            <Activity size={18} aria-hidden="true" /> <span>Activity</span>
          </NavLink>
          <NavLink to={ROUTES.PORTFOLIO}>
            <BriefcaseBusiness size={18} aria-hidden="true" />
            <span>Portfolio</span>
          </NavLink>
          <NavLink to={ROUTES.ACCOUNT}>
            <CircleUserRound size={18} aria-hidden="true" />
            <span>Account</span>
          </NavLink>
        </Navigation>
        <BasketButton
          type="button"
          onClick={() => setBasketOpen((open) => !open)}
        >
          {basketOpen ? <X size={18} /> : <ShoppingBasket size={18} />}
          <span>{basketStore.entries.length}</span>
          <span className="sr-only">
            {basketOpen ? "Close basket" : "Open basket"}
          </span>
        </BasketButton>
      </Header>
      {children}
      {basketOpen ? <BasketPanel onClose={() => setBasketOpen(false)} /> : null}
    </Page>
  );
});
