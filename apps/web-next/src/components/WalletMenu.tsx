import { useStores } from "@src/stores";
import { Check, ChevronDown, Copy, LogOut, Wallet } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  position: relative;
`;

const WalletButton = styled.button`
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 520px) {
    gap: 0;
    padding: 0 12px;

    .wallet-label,
    .wallet-chevron {
      display: none;
    }
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  width: min(320px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.floating};
`;

const AddressLabel = styled.span`
  display: block;
  padding: 8px 10px 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
`;

const Address = styled.code`
  display: block;
  overflow-wrap: anywhere;
  padding: 4px 10px 10px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.82rem;
  line-height: 1.45;
`;

const MenuButton = styled.button`
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.canvas};
  }
`;

const Divider = styled.hr`
  margin: ${({ theme }) => theme.spacing.sm} 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const WalletMenu = observer(function WalletMenu() {
  const { accountStore } = useStores();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const copyResetRef = useRef<number | null>(null);
  const wallet = accountStore.portfolioWallet ?? accountStore.wallets[0];

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
    },
    [],
  );

  async function copyAddress() {
    if (!wallet) return;

    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    if (copyResetRef.current !== null) {
      window.clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = window.setTimeout(() => setCopied(false), 1800);
  }

  async function logout() {
    setOpen(false);
    await accountStore.logout();
  }

  if (!accountStore.authenticated) {
    const disabled = !accountStore.configured || !accountStore.ready;

    return (
      <WalletButton
        type="button"
        disabled={disabled}
        aria-label={accountStore.ready ? "Connect wallet" : "Loading wallet"}
        onClick={accountStore.login}
      >
        <Wallet size={18} aria-hidden="true" />
        <span className="wallet-label">
          {accountStore.ready ? "Connect wallet" : "Loading..."}
        </span>
      </WalletButton>
    );
  }

  const buttonLabel = wallet
    ? shortenAddress(wallet.address)
    : accountStore.walletsReady
      ? "Wallet connected"
      : "Loading wallet...";

  return (
    <Container ref={containerRef}>
      <WalletButton
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Wallet ${buttonLabel}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Wallet size={18} aria-hidden="true" />
        <span className="wallet-label">{buttonLabel}</span>
        <ChevronDown className="wallet-chevron" size={16} aria-hidden="true" />
      </WalletButton>

      {open ? (
        <Menu role="menu">
          {wallet ? (
            <>
              <AddressLabel>Wallet address</AddressLabel>
              <Address>{wallet.address}</Address>
              <MenuButton type="button" role="menuitem" onClick={copyAddress}>
                {copied ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <Copy size={17} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy address"}
              </MenuButton>
              <Divider />
            </>
          ) : null}
          <MenuButton type="button" role="menuitem" onClick={logout}>
            <LogOut size={17} aria-hidden="true" />
            Log out
          </MenuButton>
        </Menu>
      ) : null}
    </Container>
  );
});

function shortenAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
