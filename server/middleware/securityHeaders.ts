import type { NextFunction, Request, Response } from "express";

export function applySecurityHeaders(request: Request, response: Response, next: NextFunction) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(self), geolocation=(self), microphone=(self), payment=(), usb=()");
  response.setHeader("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
  if (request.secure || request.headers["x-forwarded-proto"] === "https") response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
}
