import { createBrikouliApp } from "../server/_core/index";
import { serveStatic } from "../server/_core/vite";

// Vercel discovers functions under /api. The catch-all rewrite in vercel.json
// preserves the visible request path while this single Express app handles
// tRPC, auth, protected page checks, static assets, and SPA fallback.
const app = createBrikouliApp();
serveStatic(app);

export default app;
