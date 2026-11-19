export function dedupeInFlight<T>(key: string, request: () => Promise<T>): Promise<T>;
