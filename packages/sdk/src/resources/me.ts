import type { UserResponse } from "@core/core";
import type { HttpClient } from "../http";

export function meResource(http: HttpClient) {
  return {
    /** Get the currently authenticated user. Throws ApiError with code=UNAUTHORIZED if not signed in. */
    get: () => http.get<UserResponse>("/me"),
  };
}
