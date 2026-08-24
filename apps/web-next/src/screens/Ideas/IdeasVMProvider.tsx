import { IdeasVM } from "@src/screens/Ideas/IdeasVM";
import { ideasService } from "@src/services/ideas/IdeasService";
import { useStores } from "@src/stores";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";

const IdeasVMContext = createContext<IdeasVM | null>(null);

export function IdeasVMProvider({ children }: PropsWithChildren) {
  const { basketStore } = useStores();
  const vm = useMemo(
    () => new IdeasVM(ideasService, basketStore),
    [basketStore],
  );

  useEffect(() => {
    vm.initialize();
    return () => vm.dispose();
  }, [vm]);

  return (
    <IdeasVMContext.Provider value={vm}>{children}</IdeasVMContext.Provider>
  );
}

export function useIdeasVM(): IdeasVM {
  const vm = useContext(IdeasVMContext);
  if (!vm) throw new Error("useIdeasVM must be used inside IdeasVMProvider");
  return vm;
}
