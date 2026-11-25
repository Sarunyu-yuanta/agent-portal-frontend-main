import { defineEndpoint } from "@/lib/api/endpoint";
import { MOCK_SEED_NOTES } from "@/mocks/notes-mock-data";

/**
 * The notes the app starts with. With a backend this is the IC's note list
 * (e.g. `GET /notes`).
 *
 * TEMPORARY: the mock serves one demo note (`mocks/notes-mock-data.ts`). To go
 * back to an empty list, make the mock `() => []` and delete that file.
 */
export const seedNotesEndpoint = defineEndpoint("notes-seed", { mock: () => MOCK_SEED_NOTES });
