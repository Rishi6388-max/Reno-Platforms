import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
console.log("[Env Register] DATABASE_URL is set to:", process.env.DATABASE_URL);
