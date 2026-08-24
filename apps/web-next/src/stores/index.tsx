import AccountStore from "@src/stores/AccountStore";
import { BasketStore } from "@src/stores/BasketStore";
import FeedStore from "@src/stores/FeedStore";
import RootStore from "@src/stores/RootStore";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

export const storesContext = createContext<RootStore | null>(null);

export function StoresProvider({ children }: PropsWithChildren) {
  const [rootStore] = useState(() => new RootStore());

  return (
    <storesContext.Provider value={rootStore}>
      {children}
    </storesContext.Provider>
  );
}

export function useStores(): RootStore {
  const rootStore = useContext(storesContext);
  if (!rootStore)
    throw new Error("useStores must be used inside StoresProvider");
  return rootStore;
}

export { AccountStore, BasketStore, FeedStore, RootStore };
