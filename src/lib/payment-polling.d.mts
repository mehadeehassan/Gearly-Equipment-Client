export type VerificationResult = { status: "paid" | "pending" | "failed" | "expired" | "unpaid" };
export function startPaymentVerificationPolling(options: {
  verify: (signal: AbortSignal) => Promise<VerificationResult>;
  onResult: (result: VerificationResult) => void;
  onError?: (error: unknown) => boolean | void;
  onTimeout: () => void;
  intervalMs?: number;
  timeoutMs?: number;
  timers?: Pick<typeof globalThis, "setTimeout" | "clearTimeout">;
}): () => void;
