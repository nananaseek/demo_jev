export type JevErrorCode =
  | "missing_key"
  | "unauthorized"
  | "invalid_request"
  | "rate_limited"
  | "upstream"
  | "timeout"
  | "network"
  | "invalid_response"
  | "refusal";

export class JevError extends Error {
  readonly code: JevErrorCode;
  readonly status?: number;

  constructor(code: JevErrorCode, message: string, status?: number) {
    super(message);
    this.name = "JevError";
    this.code = code;
    this.status = status;
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529;
}
