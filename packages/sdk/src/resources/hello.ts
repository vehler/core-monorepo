import type { HelloRequest, HelloResponse } from "@core/core";
import type { HttpClient } from "../http";

export function helloResource(http: HttpClient) {
  return {
    greet: (input: HelloRequest) => http.post<HelloResponse>("/hello", input),
  };
}
