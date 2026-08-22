import { createBrikouliApp } from "./server/_core/index";
import { serveStatic } from "./server/_core/vite";

// Vercel detects this root Express default export and runs it as one Node.js
// Function. Static files are built to dist/public by `vercel-build`; the
// includeFiles rule in vercel.json retains index.html for protected SPA routes.
const app = createBrikouliApp();
serveStatic(app);

export default app;
