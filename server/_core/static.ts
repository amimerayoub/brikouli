import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const marketingMediaPath = path.resolve(process.cwd(), "manus-storage");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // These are project-owned marketing assets. User-uploaded private content
  // continues through its existing storage flow; this route only removes the
  // public branding imagery's dependency on the Manus proxy in Vercel.
  app.use("/media", express.static(marketingMediaPath));
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
