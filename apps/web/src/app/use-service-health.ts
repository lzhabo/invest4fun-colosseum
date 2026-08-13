import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export type ServiceStatus = "checking" | "online" | "offline";

export function useServiceHealth(): ServiceStatus {
  const [status, setStatus] = useState<ServiceStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then(() => setStatus("online"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("offline");
      });
    return () => controller.abort();
  }, []);

  return status;
}
