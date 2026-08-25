import { type IdeasResponse, ideasResponseSchema } from "@invest4fun/contracts";
import { getJson } from "@src/services/http/getJson";

export interface IdeasService {
  loadIdeas(signal?: AbortSignal): Promise<IdeasResponse>;
}

export const ideasService: IdeasService = {
  loadIdeas(signal) {
    return getJson("/api/ideas", ideasResponseSchema.parse, signal);
  },
};
