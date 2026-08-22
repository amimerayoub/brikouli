import { createRequire } from "node:module";
import type { Express } from "express";

// Vercel discovers this API route. Its app implementation is a single CommonJS
// bundle generated before function tracing, which preserves Express dependency
// loading while avoiding source-only module resolution under /var/task.
const require = createRequire(import.meta.url);
const app = require("./_brikouli.cjs") as Express;

export default app;
