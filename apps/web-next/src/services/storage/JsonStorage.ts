export interface JsonStorage<T> {
  load(): T;
  save(value: T): void;
}

export function createVersionedJsonStorage<T>({
  key,
  version,
  fallback,
  parse,
}: {
  key: string;
  version: number;
  fallback: T;
  parse: (value: unknown) => T;
}): JsonStorage<T> {
  return {
    load() {
      try {
        const stored = window.localStorage.getItem(key);
        if (!stored) return fallback;
        const envelope = JSON.parse(stored) as {
          version?: unknown;
          value?: unknown;
        };
        return envelope.version === version ? parse(envelope.value) : fallback;
      } catch {
        return fallback;
      }
    },
    save(value) {
      window.localStorage.setItem(key, JSON.stringify({ version, value }));
    },
  };
}
