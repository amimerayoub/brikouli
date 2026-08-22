import express from "express";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { requireProtectedRoute } from "../middleware/routeProtection";
import { registerSupabaseSessionRoutes } from "../routes/supabaseSession";
import { registerAuthActionRoutes } from "../routes/authActions";
import { applySecurityHeaders } from "../middleware/securityHeaders";

export function createBrikouliApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerAuthActionRoutes(app);
  registerSupabaseSessionRoutes(app);
  app.use(requireProtectedRoute);
  // Vercel includes the supplied public marketing images with the function.
  // Serve known project files first; non-existent paths continue to the
  // existing private Manus storage proxy without changing that data flow.
  app.use("/manus-storage", express.static(path.resolve(process.cwd(), "manus-storage")));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}
