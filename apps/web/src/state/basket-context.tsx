import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/auth-context";
import { getDraftBasket, saveDraftBasket } from "../services/api";

export type BasketEntry = {
  id: string;
  title: string;
  kind: "asset" | "idea";
  amountUsd: number;
  sourceVersionId?: string | null | undefined;
  sourceSnapshot?: unknown | undefined;
};
type BasketSource = Pick<BasketEntry, "id" | "kind">;
export type BasketSyncStatus =
  | "local"
  | "loading"
  | "saving"
  | "synced"
  | "error";

type BasketContextValue = {
  entries: BasketEntry[];
  count: number;
  isOpen: boolean;
  syncStatus: BasketSyncStatus;
  syncError: string | null;
  add: (entry: BasketEntry) => void;
  updateAmount: (source: BasketSource, amountUsd: number) => void;
  remove: (source: BasketSource) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  retrySync: () => void;
};

const STORAGE_KEY = "invest4fun:basket:v1";
const BasketContext = createContext<BasketContextValue | null>(null);

function readStoredBasket(): BasketEntry[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const value: unknown = JSON.parse(stored);
    if (!Array.isArray(value)) return [];
    return value.filter(isBasketEntry).map((entry) => ({
      ...entry,
      amountUsd: entry.amountUsd ?? 50,
    }));
  } catch {
    return [];
  }
}

function isBasketEntry(value: unknown): value is BasketEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    (entry.kind === "asset" || entry.kind === "idea") &&
    (typeof entry.amountUsd === "number" || entry.amountUsd === undefined)
  );
}

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [entries, setEntries] = useState<BasketEntry[]>(readStoredBasket);
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<BasketSyncStatus>("local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const entriesRef = useRef(entries);
  const remoteReady = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);
  entriesRef.current = entries;

  useEffect(() => {
    if (!auth.authenticated || !auth.accountReady) {
      remoteReady.current = false;
      setSyncStatus("local");
      return;
    }

    let cancelled = false;
    setSyncStatus("loading");
    setSyncError(null);
    void (async () => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) return;
      try {
        if (syncAttempt > 0) {
          const saved = await saveDraftBasket(
            entriesRef.current.map(({ id, kind, amountUsd }) => ({
              id,
              kind,
              amountUsd,
            })),
            accessToken,
          );
          if (!cancelled && saved.basket)
            setEntries(saved.basket.items.map(toBasketEntry));
          remoteReady.current = true;
          if (!cancelled) setSyncStatus("synced");
          return;
        }
        const response = await getDraftBasket(accessToken);
        if (cancelled) return;
        if (response.basket) {
          setEntries(response.basket.items.map(toBasketEntry));
        } else if (entriesRef.current.length) {
          const saved = await saveDraftBasket(
            entriesRef.current.map(({ id, kind, amountUsd }) => ({
              id,
              kind,
              amountUsd,
            })),
            accessToken,
          );
          if (!cancelled && saved.basket)
            setEntries(saved.basket.items.map(toBasketEntry));
        }
        remoteReady.current = true;
        if (!cancelled) setSyncStatus("synced");
      } catch {
        remoteReady.current = false;
        if (!cancelled) {
          setSyncStatus("error");
          setSyncError(
            "Your basket is saved on this device, but could not sync to your account.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.accountReady, auth.authenticated, auth.getAccessToken, syncAttempt]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    if (!remoteReady.current || !auth.authenticated || !auth.accountReady) {
      return;
    }

    window.clearTimeout(saveTimer.current);
    setSyncStatus("saving");
    setSyncError(null);
    saveTimer.current = window.setTimeout(() => {
      void auth.getAccessToken().then((accessToken) => {
        if (!accessToken) return;
        void saveDraftBasket(
          entries.map(({ id, kind, amountUsd }) => ({ id, kind, amountUsd })),
          accessToken,
        )
          .then(() => setSyncStatus("synced"))
          .catch(() => {
            setSyncStatus("error");
            setSyncError(
              "Your latest basket changes could not sync. Retry before preparing a purchase.",
            );
          });
      });
    }, 350);

    return () => window.clearTimeout(saveTimer.current);
  }, [auth.accountReady, auth.authenticated, auth.getAccessToken, entries]);

  const value = useMemo<BasketContextValue>(
    () => ({
      entries,
      count: entries.length,
      isOpen,
      syncStatus,
      syncError,
      add: (entry) =>
        setEntries((current) =>
          current.some((item) => sameBasketSource(item, entry))
            ? current
            : [...current, { ...entry, amountUsd: entry.amountUsd ?? 50 }],
        ),
      updateAmount: (source, amountUsd) =>
        setEntries((current) =>
          current.map((entry) =>
            sameBasketSource(entry, source) ? { ...entry, amountUsd } : entry,
          ),
        ),
      remove: (source) =>
        setEntries((current) =>
          current.filter((entry) => !sameBasketSource(entry, source)),
        ),
      clear: () => setEntries([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      retrySync: () => setSyncAttempt((attempt) => attempt + 1),
    }),
    [entries, isOpen, syncError, syncStatus],
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

function toBasketEntry(entry: {
  id: string;
  title: string;
  kind: "asset" | "idea";
  amountUsd: number;
  sourceVersionId?: string | null | undefined;
  sourceSnapshot?: unknown | undefined;
}): BasketEntry {
  return entry;
}

function sameBasketSource(left: BasketSource, right: BasketSource) {
  return left.kind === right.kind && left.id === right.id;
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) throw new Error("useBasket must be used inside BasketProvider");
  return context;
}
