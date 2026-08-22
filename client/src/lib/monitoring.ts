export function reportClientError(error: Error, context: Record<string, string | number | boolean> = {}) {
  const event = { event: "client_error", name: error.name || "Error", path: typeof window === "undefined" ? "server" : window.location.pathname, ...context };
  // The managed runtime collects console error telemetry. Do not serialize message bodies, stacks, form fields, or user identifiers here.
  console.error("[brikouli-monitoring]", event);
}
