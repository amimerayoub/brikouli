import type { NextFunction, Request, Response } from "express";
import { parse } from "cookie";
import type { UserRole } from "@shared/brikouli.types";
import { verifyActor } from "../services/supabase";

export const SUPABASE_SESSION_COOKIE = "brikouli_access_token";

export function requiredRoleForPath(pathname: string): "authenticated" | "employer" | "admin" | null {
  if (["/dashboard", "/profile", "/messages"].some(path => pathname === path || pathname.startsWith(`${path}/`))) return "authenticated";
  if (pathname === "/employer" || pathname.startsWith("/employer/")) return "employer";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  return null;
}

export function hasRequiredRole(role: UserRole, requirement: ReturnType<typeof requiredRoleForPath>): boolean {
  return requirement === "authenticated" || (requirement === "employer" && (role === "employer" || role === "admin")) || (requirement === "admin" && role === "admin");
}

function tokenFor(request: Request) {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return parse(request.headers.cookie ?? "")[SUPABASE_SESSION_COOKIE] ?? null;
}

export async function requireProtectedRoute(request: Request, response: Response, next: NextFunction) {
  const requirement = requiredRoleForPath(request.path);
  if (!requirement) return next();
  const token = tokenFor(request);
  if (!token) return response.redirect(302, `/login?next=${encodeURIComponent(request.originalUrl)}`);
  const actor = await verifyActor(token);
  if (!actor.success) { response.clearCookie(SUPABASE_SESSION_COOKIE, { path: "/" }); return response.redirect(302, `/login?next=${encodeURIComponent(request.originalUrl)}`); }
  if (!hasRequiredRole(actor.data.profile.role, requirement)) return response.status(403).type("text/plain").send("Forbidden");
  return next();
}
