import { createBrikouliApp } from "../server/_core/app";
import { serveStatic } from "../server/_core/static";

// This entry is bundled into _brikouli.mjs during `vercel-build`. The leading
// underscore keeps it from becoming a standalone Vercel route; api/index.mjs
// is the only deployed function entrypoint.
const app = createBrikouliApp();
serveStatic(app);

export default app;
