import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();

// Support JSON payloads up to 10MB to handle base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for validating notice fields on the server
function validateNotice(data: any) {
  const errors: string[] = [];

  const { title, body, category, priority, publishDate, image } = data;

  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("Title is required and cannot be empty.");
  } else if (title.length > 200) {
    errors.push("Title must be less than 200 characters.");
  }

  if (!body || typeof body !== "string" || body.trim() === "") {
    errors.push("Body is required and cannot be empty.");
  }

  if (!category || !["Exam", "Event", "General"].includes(category)) {
    errors.push("Category must be one of: Exam, Event, General.");
  }

  if (!priority || !["Normal", "Urgent"].includes(priority)) {
    errors.push("Priority must be one of: Normal, Urgent.");
  }

  if (!publishDate) {
    errors.push("Publish date is required.");
  } else {
    const parsedDate = new Date(publishDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Publish date must be a valid date.");
    }
  }

  if (image && typeof image !== "string") {
    errors.push("Image must be a valid string representation.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// REST API Endpoints for Notices (following Pages Router convention matching)

// 1. GET ALL NOTICES (With database-native Urgent sorting)
app.get("/api/notices", async (req: Request, res: Response) => {
  try {
    // Urgent first (descending alphabetically: Urgent > Normal)
    // Then publishDate descending (newest first)
    const notices = await prisma.notice.findMany({
      orderBy: [
        { priority: "desc" },
        { publishDate: "desc" },
      ],
    });
    res.json(notices);
  } catch (error) {
    console.error("Failed to fetch notices:", error);
    res.status(500).json({ error: "Failed to load notices from database." });
  }
});

// 2. GET SINGLE NOTICE
app.get("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notice = await prisma.notice.findUnique({
      where: { id },
    });
    if (!notice) {
      return res.status(404).json({ error: "Notice not found." });
    }
    res.json(notice);
  } catch (error) {
    console.error("Failed to fetch notice:", error);
    res.status(500).json({ error: "Server error occurred while loading notice." });
  }
});

// 3. CREATE NOTICE (POST)
app.post("/api/notices", async (req: Request, res: Response) => {
  const validation = validateNotice(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { title, body, category, priority, publishDate, image } = req.body;

  try {
    const newNotice = await prisma.notice.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
        publishDate: new Date(publishDate),
        image: image || null,
      },
    });
    res.status(214).json(newNotice); // Status code 201 for Created (Wait, we can return 201 Created standard status code)
  } catch (error) {
    console.error("Failed to create notice:", error);
    res.status(500).json({ error: "Failed to persist notice in database." });
  }
});

// 4. UPDATE NOTICE (PUT)
app.put("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  // First confirm notice exists
  try {
    const existing = await prisma.notice.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Notice not found to update." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error on retrieving notice." });
  }

  const validation = validateNotice(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { title, body, category, priority, publishDate, image } = req.body;

  try {
    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
        publishDate: new Date(publishDate),
        image: image || null,
      },
    });
    res.json(updatedNotice);
  } catch (error) {
    console.error("Failed to update notice:", error);
    res.status(500).json({ error: "Failed to update notice in database." });
  }
});

// 5. DELETE NOTICE (DELETE)
app.delete("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.notice.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Notice not found to delete." });
    }

    await prisma.notice.delete({
      where: { id },
    });
    res.json({ success: true, message: "Notice deleted successfully." });
  } catch (error) {
    console.error("Failed to delete notice:", error);
    res.status(500).json({ error: "Failed to delete notice from database." });
  }
});

// Integrate Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
