import type { Database } from "@invest4fun/database";

type LinkedAccount = {
  type?: string;
  address?: string;
  chain_type?: string;
  wallet_client_type?: string;
  walletClientType?: string;
  meta?: { name?: string };
};

type PrivyUser = {
  linked_accounts?: LinkedAccount[];
};

type AccountRow = {
  id: string;
  status: "active" | "suspended" | "deleted";
};

type WalletRow = {
  id: string;
  chain: "solana";
  address: string;
  role: "embedded" | "external";
  custody_provider: string;
  label: string | null;
  is_active: boolean;
};

function isSolanaWallet(account: LinkedAccount) {
  return account.type === "wallet" && account.chain_type === "solana";
}

function walletRole(account: LinkedAccount): "embedded" | "external" {
  const clientType = account.wallet_client_type ?? account.walletClientType;
  return clientType === "privy" || clientType === "privy-v2"
    ? "embedded"
    : "external";
}

export async function bootstrapAccount(
  database: Database,
  privy: { users: () => { _get: (userId: string) => Promise<PrivyUser> } },
  privyUserId: string,
) {
  const privyUser = await privy.users()._get(privyUserId);
  const linkedWallets = (privyUser.linked_accounts ?? []).filter(
    (account) => isSolanaWallet(account) && account.address,
  );

  const existing = await database.query<AccountRow>(
    `
      select u.id, u.status
      from app.users u
      join app.auth_identities i on i.user_id = u.id
      where i.provider = $1 and i.external_subject = $2
    `,
    ["privy", privyUserId],
  );

  let user = existing.rows[0];
  if (!user) {
    const created = await database.query<AccountRow>(
      `insert into app.users default values returning id, status`,
    );
    user = created.rows[0];
  }
  if (!user) throw new Error("INTERNAL_USER_BOOTSTRAP_FAILED");

  await database.query(
    `
      insert into app.auth_identities (user_id, provider, external_subject)
      values ($1, $2, $3)
      on conflict (provider, external_subject)
      do update set updated_at = now()
    `,
    [user.id, "privy", privyUserId],
  );

  for (const wallet of linkedWallets) {
    const address = wallet.address as string;
    const role = walletRole(wallet);
    await database.query(
      `
        insert into app.wallets
          (user_id, chain, address, role, custody_provider, label)
        values ($1, 'solana', $2, $3, 'privy', $4)
        on conflict (chain, address)
        do update set
          user_id = excluded.user_id,
          role = excluded.role,
          label = excluded.label,
          updated_at = now()
      `,
      [user.id, address, role, wallet.meta?.name ?? null],
    );
  }

  const wallets = await database.query<WalletRow>(
    `
      select id, chain, address, role, custody_provider, label, is_active
      from app.wallets
      where user_id = $1 and is_active = true
      order by role asc, created_at asc
    `,
    [user.id],
  );

  return {
    user: { id: user.id, status: user.status },
    identity: { provider: "privy", externalSubject: privyUserId },
    wallets: wallets.rows.map((wallet) => ({
      id: wallet.id,
      chain: wallet.chain,
      address: wallet.address,
      role: wallet.role,
      provider: wallet.custody_provider,
      label: wallet.label,
      active: wallet.is_active,
    })),
  };
}
