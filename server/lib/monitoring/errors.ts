export const safeErrorCode = (error: unknown) => error instanceof Error ? error.name : "unknown_error";
