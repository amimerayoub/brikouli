# Request middleware boundary

Phase 1 is a static public frontend, so it deliberately does not execute request middleware. When a server-backed phase is introduced, route middleware should apply `securityHeaders` from `client/src/lib/security/headers.ts`, protect authenticated routes, validate trusted origins, and attach a deployment-specific Content Security Policy.

No administrative route is declared in this release. Future protected and administrative areas should be added only after authentication, authorization, and audit requirements are implemented.
