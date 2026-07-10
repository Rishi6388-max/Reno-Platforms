import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

if (process.env.VERCEL) {
  // We are running on Vercel!
  // Since the Vercel filesystem is read-only, we must copy our SQLite dev.db to the writeable /tmp directory.
  const srcPath = path.join(process.cwd(), "dev.db");
  const destPath = "/tmp/dev.db";

  try {
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log("[Vercel Env] Successfully copied dev.db to /tmp/dev.db");
      } else {
        console.log("[Vercel Env] dev.db already exists in /tmp");
      }
    } else {
      console.warn("[Vercel Env] Warning: Source dev.db not found at:", srcPath);
    }
  } catch (err) {
    console.error("[Vercel Env] Failed to copy dev.db to /tmp:", err);
  }

  process.env.DATABASE_URL = "file:/tmp/dev.db";
} else {
  // Local environment or container running locally
  process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
}

console.log("[Env Register] DATABASE_URL is set to:", process.env.DATABASE_URL);

