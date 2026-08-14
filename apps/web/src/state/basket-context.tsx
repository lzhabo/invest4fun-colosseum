import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BasketEntry = {
  id: string;
  title: string;
  kind: "asset" | "idea";
};

type BasketContextValue = {
  entries: BasketEntry[];
  count: number;
  isOpen: boolean;
  add: (entry: BasketEntry) => void;
  remove: (id: string) => void;
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
    return value.filter(isBasketEntry);
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
    (entry.kind === "asset" || entry.kind === "idea")
  );
}

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<BasketEntry[]>(readStoredBasket);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const value = useMemo<BasketContextValue>(
    () => ({
      entries,
      count: entries.length,
      isOpen,
      add: (entry) =>
        setEntries((current) =>
          current.some((item) => item.id === entry.id)
            ? current
            : [...current, entry],
        ),
      remove: (id) =>
        setEntries((current) => current.filter((entry) => entry.id !== id)),
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

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) throw new Error("useBasket must be used inside BasketProvider");
  return context;
}
