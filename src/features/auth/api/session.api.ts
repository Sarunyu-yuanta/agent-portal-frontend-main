import { defineEndpoint } from "@/lib/api/endpoint";
import { MOCK_CURRENT_IC } from "@/mocks/session";

/**
 * Who is signed in. With a backend this reads the session (e.g. `GET /me`)
 * and the auth token is attached by `setAuthHeaderProvider` in `lib/api/http`.
 */
export const currentIcEndpoint = defineEndpoint("current-ic", { mock: () => MOCK_CURRENT_IC });
