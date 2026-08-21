import type { Express } from "express";
import { SUPABASE_SESSION_COOKIE } from "../middleware/routeProtection";
import { verifyActor } from "../services/supabase";

const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 1000 });

/** Exchanges a browser session token for a verified, HTTP-only server route cookie. */
export function registerSupabaseSessionRoutes(app: Express) {
  app.post("/api/auth/session", async (request, response) => {
    const accessToken = typeof request.body?.accessToken === "string" ? request.body.accessToken : "";
    if (!accessToken || accessToken.length > 4096) return response.status(400).json({ success: false, code: "INVALID_TOKEN" });
    const actor = await verifyActor(accessToken);
    if (!actor.success) return response.status(401).json({ success: false, code: "UNAUTHORIZED" });
    response.cookie(SUPABASE_SESSION_COOKIE, accessToken, cookieOptions());
    return response.status(204).end();
  });

  app.post("/api/auth/logout", (_request, response) => {
    response.clearCookie(SUPABASE_SESSION_COOKIE, { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    return response.status(204).end();
  });
}
