import type { Express } from "express";
import { ENV } from "../_core/env";

/** Streams the managed JavaScript map bootstrap through the application server. */
export function registerManagedMapScriptRoute(app: Express) {
  app.get("/api/maps/script", async (_request, response) => {
    try {
      const url = new URL(`${ENV.forgeApiUrl.replace(/\/+$/, "")}/v1/maps/proxy/maps/api/js`);
      url.searchParams.set("key", ENV.forgeApiKey);
      url.searchParams.set("v", "weekly");
      url.searchParams.set("libraries", "marker,places,geometry");
      const upstream = await fetch(url);
      if (!upstream.ok) return response.status(502).type("text/plain").send("Managed map bootstrap is unavailable.");
      response.setHeader("Cache-Control", "private, max-age=300");
      response.type("application/javascript").send(await upstream.text());
    } catch {
      response.status(502).type("text/plain").send("Managed map bootstrap is unavailable.");
    }
  });
}
