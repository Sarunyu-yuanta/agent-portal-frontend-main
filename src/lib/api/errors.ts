/** A request that reached the server and came back with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** The request did not answer within the timeout. */
export class TimeoutError extends Error {
  constructor(path: string, ms: number) {
    super(`Request to ${path} timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/** The response arrived but did not match the expected shape. */
export class ResponseShapeError extends Error {
  readonly issues: unknown;

  constructor(path: string, issues: unknown) {
    super(`Unexpected response shape from ${path}`);
    this.name = "ResponseShapeError";
    this.issues = issues;
  }
}
