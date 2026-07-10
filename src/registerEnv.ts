import dotenv from "dotenv";

dotenv.config();

// Ensure there's a fallback DATABASE_URL for Prisma Client generation if none is provided.
if (!process.env.DATABASE_URL) {
  // We provide a valid-looking postgres connection string placeholder so that Prisma can build and generate without errors
  process.env.DATABASE_URL = "postgresql://placeholder_user:placeholder_pass@localhost:5432/notice_board?schema=public";
  console.log("[Env Register] DATABASE_URL was not set. Using temporary placeholder.");
} else {
  console.log("[Env Register] DATABASE_URL is active.");
}
