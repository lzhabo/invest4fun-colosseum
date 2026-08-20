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
  const linkedWalletAddresses = linkedWallets.map(
    (wallet) => wallet.address as string,
  );
  const activeEmbeddedAddress =
    linkedWallets.find((wallet) => walletRole(wallet) === "embedded")
      ?.address ?? null;

  const account = await database.query<AccountRow>(
    `
      with candidate_user as (
        insert into app.users default values
        returning id
      ),
      identity as (
        insert into app.auth_identities (user_id, provider, external_subject)
        select id, $1, $2
        from candidate_user
        on conflict (provider, external_subject)
        do update set updated_at = now()
        returning user_id
      ),
      cleanup_candidate as (
        delete from app.users
        using candidate_user, identity
        where app.users.id = candidate_user.id
          and identity.user_id <> candidate_user.id
        returning app.users.id
      )
      select u.id, u.status
      from app.users u
      join identity i on i.user_id = u.id
    `,
    ["privy", privyUserId],
  );

  const user = account.rows[0];
  if (!user) throw new Error("INTERNAL_USER_BOOTSTRAP_FAILED");

  await database.query(
    `
      update app.wallets
      set is_active = false, updated_at = now()
      where user_id = $1
        and chain = 'solana'
        and custody_provider = 'privy'
        and role = 'embedded'
        and ($2::text is null or address <> $2)
    `,
    [user.id, activeEmbeddedAddress],
  );

  for (const wallet of linkedWallets) {
    const address = wallet.address as string;
    const role = walletRole(wallet);
    const active = role === "external" || address === activeEmbeddedAddress;
    await database.query(
      `
        insert into app.wallets
          (user_id, chain, address, role, custody_provider, label, is_active)
        values ($1, 'solana', $2, $3, 'privy', $4, $5)
        on conflict (chain, address)
        do update set
          role = excluded.role,
          label = excluded.label,
          is_active = excluded.is_active,
          updated_at = now()
        where app.wallets.user_id = excluded.user_id
      `,
      [user.id, address, role, wallet.meta?.name ?? null, active],
    );
  }

  await database.query(
    `
      update app.wallets
      set is_active = (address = any($2::text[])), updated_at = now()
      where user_id = $1
        and chain = 'solana'
        and custody_provider = 'privy'
        and role = 'external'
    `,
    [user.id, linkedWalletAddresses],
  );

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
