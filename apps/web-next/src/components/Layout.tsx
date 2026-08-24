import { ROUTES } from "@src/app/routes/routes";
import { WalletMenu } from "@src/components/WalletMenu";
import {
  BriefcaseBusiness,
  CircleUserRound,
  GalleryVerticalEnd,
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

  @media (max-width: 760px) {
    padding: 0 12px;
  }
`;

const Brand = styled.strong`
  font-size: 1.15rem;
  letter-spacing: -0.04em;

  @media (max-width: 760px) {
    display: none;
  }
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
    gap: 0;

    a span {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }
`;

export function Layout({ children }: PropsWithChildren) {
  return (
    <Page>
      <Header>
        <Brand>Invest4Fun</Brand>
        <Navigation aria-label="Primary navigation">
          <NavLink to={ROUTES.FEED}>
            <GalleryVerticalEnd size={18} aria-hidden="true" />
            <span>Feed</span>
          </NavLink>
          <NavLink to={ROUTES.IDEAS}>
            <Lightbulb size={18} aria-hidden="true" /> <span>Ideas</span>
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
