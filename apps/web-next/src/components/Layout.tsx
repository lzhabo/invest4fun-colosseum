import { ROUTES } from "@src/app/routes/routes";
import { WalletMenu } from "@src/components/WalletMenu";
import {
  Activity,
  BriefcaseBusiness,
  CircleUserRound,
  Lightbulb,
} from "lucide-react";
import type { PropsWithChildren } from "react";
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

export function Layout({ children }: PropsWithChildren) {
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
        <WalletMenu />
      </Header>
      {children}
    </Page>
  );
}
