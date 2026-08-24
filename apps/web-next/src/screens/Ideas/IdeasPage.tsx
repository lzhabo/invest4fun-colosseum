import { IdeasScreen } from "@src/screens/Ideas/IdeasScreen";
import { IdeasVMProvider } from "@src/screens/Ideas/IdeasVMProvider";

export function IdeasPage() {
  return (
    <IdeasVMProvider>
      <IdeasScreen />
    </IdeasVMProvider>
  );
}
