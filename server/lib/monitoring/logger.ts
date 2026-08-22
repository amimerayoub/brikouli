type SafeMetadata = Record<string, string | number | boolean | null | undefined>;
export function logEvent(event: string, metadata: SafeMetadata = {}) { console.info(JSON.stringify({ level: "info", event, at: new Date().toISOString(), ...metadata })); }
export function logError(event: string, error: unknown, metadata: SafeMetadata = {}) { const message = error instanceof Error ? error.message : "unknown_error"; console.error(JSON.stringify({ level: "error", event, message: message.slice(0, 500), at: new Date().toISOString(), ...metadata })); }
