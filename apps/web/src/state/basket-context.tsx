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
};
type BasketSource = Pick<BasketEntry, "id" | "kind">;

type BasketContextValue = {
  entries: BasketEntry[];
  count: number;
  isOpen: boolean;
  add: (entry: BasketEntry) => void;
  updateAmount: (source: BasketSource, amountUsd: number) => void;
  remove: (source: BasketSource) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
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
  const entriesRef = useRef(entries);
  const remoteReady = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);
  entriesRef.current = entries;

  useEffect(() => {
    if (!auth.authenticated || !auth.accountReady) {
      remoteReady.current = false;
      return;
    }

    let cancelled = false;
    void (async () => {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) return;
      try {
        const response = await getDraftBasket(accessToken);
        if (cancelled) return;
        if (response.basket) {
          setEntries(
            response.basket.items.map(({ id, title, kind, amountUsd }) => ({
              id,
              title,
              kind,
              amountUsd,
            })),
          );
        } else if (entriesRef.current.length) {
          await saveDraftBasket(
            entriesRef.current.map(({ id, kind, amountUsd }) => ({
              id,
              kind,
              amountUsd,
            })),
            accessToken,
          );
        }
        remoteReady.current = true;
      } catch {
        remoteReady.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.accountReady, auth.authenticated, auth.getAccessToken]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    if (!remoteReady.current || !auth.authenticated || !auth.accountReady) {
      return;
    }

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void auth.getAccessToken().then((accessToken) => {
        if (!accessToken) return;
        void saveDraftBasket(
          entries.map(({ id, kind, amountUsd }) => ({ id, kind, amountUsd })),
          accessToken,
        ).catch(() => undefined);
      });
    }, 350);

    return () => window.clearTimeout(saveTimer.current);
  }, [auth.accountReady, auth.authenticated, auth.getAccessToken, entries]);

  const value = useMemo<BasketContextValue>(
    () => ({
      entries,
      count: entries.length,
      isOpen,
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
    }),
    [entries, isOpen],
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

function sameBasketSource(left: BasketSource, right: BasketSource) {
  return left.kind === right.kind && left.id === right.id;
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) throw new Error("useBasket must be used inside BasketProvider");
  return context;
}
