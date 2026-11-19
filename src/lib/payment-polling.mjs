const terminalStatuses = new Set(["paid", "failed", "expired", "unpaid"]);

export function startPaymentVerificationPolling({
  verify,
  onResult,
  onError,
  onTimeout,
  intervalMs = 3000,
  timeoutMs = 60000,
  timers = globalThis,
}) {
  let active = true;
  let inFlight = false;
  let pollTimer = null;
  let timeoutTimer = null;
  const controller = new AbortController();

  const stop = () => {
    if (!active) return;
    active = false;
    if (pollTimer !== null) timers.clearTimeout(pollTimer);
    if (timeoutTimer !== null) timers.clearTimeout(timeoutTimer);
    controller.abort();
  };

  const scheduleNext = () => {
    if (active) pollTimer = timers.setTimeout(check, intervalMs);
  };

  async function check() {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const result = await verify(controller.signal);
      if (!active) return;
      onResult(result);
      if (terminalStatuses.has(result?.status)) stop();
    } catch (error) {
      if (active) {
        const shouldStop = onError?.(error);
        if (shouldStop) stop();
      }
    } finally {
      inFlight = false;
      scheduleNext();
    }
  }

  timeoutTimer = timers.setTimeout(() => {
    if (!active) return;
    onTimeout();
    stop();
  }, timeoutMs);
  void check();
  return stop;
}
