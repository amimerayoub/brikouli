/**
 * Brikouli Phase 1 security contract.
 *
 * Apply these policies at the deployment edge or future server middleware. They are kept
 * separate from views so the product can adopt a server runtime without changing UI code.
 */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
} as const;

export const contentSecurityPolicyDirectives = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self'",
  "connect-src 'self'",
] as const;
