const inFlightRequests = new Map();

/** Share only an active request; the result is removed as soon as it settles. */
export function dedupeInFlight(key, request) {
  const current = inFlightRequests.get(key);
  if (current) return current;

  const promise = Promise.resolve()
    .then(request)
    .finally(() => {
      if (inFlightRequests.get(key) === promise) inFlightRequests.delete(key);
    });
  inFlightRequests.set(key, promise);
  return promise;
}
