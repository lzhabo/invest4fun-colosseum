import { HttpError } from "@src/services/http/HttpError";

export async function getJson<T>(
  path: string,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, signal ? { signal } : undefined);

  if (!response.ok) {
    throw new HttpError(response.status, "API_REQUEST_FAILED");
  }

  return parse(await response.json());
}
