import "../src/registerEnv";

import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Support JSON payloads up to 10MB to handle base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Let's define the Notice interface for type safety
interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  publishDate: Date;
  image?: string | null;
  createdAt: Date;
}

// Memory-based fallback data in case database is down, offline, or unconfigured
let mockNotices: Notice[] = [
  {
    id: "mock-notice-1",
    title: "Final Semester Examination Schedule (Fall 2026)",
    body: "The official end-semester exam schedule is published. Exams will commence from July 20th, 2026. Hall tickets will be issued at the main administrative block beginning Monday. Please check with your course coordinators to resolve any scheduling clashes before Friday.",
    category: "Exam",
    priority: "Urgent",
    publishDate: new Date("2026-07-09T09:00:00.000Z"),
    createdAt: new Date("2026-07-09T09:00:00.000Z"),
    image: null
  },
  {
    id: "mock-notice-2",
    title: "Annual Tech Fest 'Innovate 2026' Registrations",
    body: "Unleash your creativity at our annual national-level technical symposium and hackathon! We are hosting a 48-hour project design challenge, guest lectures by tech leaders, and coding tournaments. Registrations close on July 18th. Free food and exclusive swag for all registered participants.",
    category: "Event",
    priority: "Normal",
    publishDate: new Date("2026-07-08T14:30:00.000Z"),
    createdAt: new Date("2026-07-08T14:30:00.000Z"),
    image: null
  },
  {
    id: "mock-notice-3",
    title: "Campus-wide Wi-Fi Upgrade & Outage Schedule",
    body: "The central network operations center will undergo major infrastructure router upgrades this Sunday, July 12th, between 1:00 AM and 5:00 AM. Intermittent internet connectivity is expected across all academic buildings and hostels. We appreciate your patience during this system improvement.",
    category: "General",
    priority: "Normal",
    publishDate: new Date("2026-07-07T10:00:00.000Z"),
    createdAt: new Date("2026-07-07T10:00:00.000Z"),
    image: null
  }
];

// Check if the DATABASE_URL is configured and isn't the fallback/placeholder string
function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  if (!url || url.includes("placeholder_user") || url.startsWith("file:") || url.startsWith("sqlite:")) {
    return false;
  }
  return true;
}

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

// 1. GET ALL NOTICES
app.get("/api/notices", async (req: Request, res: Response) => {
  if (isDatabaseConfigured()) {
    try {
      console.log("[Database] Attempting to retrieve notices from Prisma...");
      const notices = await prisma.notice.findMany({
        orderBy: [
          { priority: "desc" },
          { publishDate: "desc" },
        ],
      });
      console.log(`[Database] Successfully retrieved ${notices.length} notices.`);
      return res.json(notices);
    } catch (error: any) {
      console.error("[Database Connection Error] Failed to fetch notices from Postgres. Falling back to memory-based fallback notices.", error.message || error);
    }
  } else {
    console.log("[Database Notice] Database URL is not configured/active. Serving mock-fallback data.");
  }

  // Fallback: Sort mock notices (Urgent first, then published date desc)
  const sortedMock = [...mockNotices].sort((a, b) => {
    if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
    if (a.priority !== "Urgent" && b.priority === "Urgent") return 1;
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });
  return res.json(sortedMock);
});

// 2. GET SINGLE NOTICE
app.get("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isDatabaseConfigured()) {
    try {
      console.log(`[Database] Attempting to retrieve notice with ID ${id}...`);
      const notice = await prisma.notice.findUnique({
        where: { id },
      });
      if (notice) {
        return res.json(notice);
      }
      // If we queried successfully but found nothing, return 404
      return res.status(404).json({ error: "Notice not found." });
    } catch (error: any) {
      console.error(`[Database Connection Error] Failed to query notice ID ${id} from Postgres. Checking in-memory notices.`, error.message || error);
    }
  }

  // Fallback to memory-based lookup
  const mockNotice = mockNotices.find((n) => n.id === id);
  if (!mockNotice) {
    return res.status(404).json({ error: "Notice not found in mock store." });
  }
  return res.json(mockNotice);
});

// 3. CREATE NOTICE (POST)
app.post("/api/notices", async (req: Request, res: Response) => {
  const validation = validateNotice(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { title, body, category, priority, publishDate, image } = req.body;

  if (isDatabaseConfigured()) {
    try {
      console.log("[Database] Attempting to insert notice into Postgres...");
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
      console.log("[Database] Successfully created notice with ID:", newNotice.id);
      return res.status(201).json(newNotice);
    } catch (error: any) {
      console.error("[Database Connection Error] Failed to create notice in Postgres. Persisting in memory-based store.", error.message || error);
    }
  }

  // Fallback to memory-based creation
  const newMockNotice: Notice = {
    id: `mock-id-${Math.random().toString(36).substring(2, 9)}`,
    title: title.trim(),
    body: body.trim(),
    category,
    priority,
    publishDate: new Date(publishDate),
    image: image || null,
    createdAt: new Date(),
  };

  mockNotices.push(newMockNotice);
  console.log("[Mock Store] Notice successfully created in-memory:", newMockNotice.id);
  return res.status(201).json(newMockNotice);
});

// 4. UPDATE NOTICE (PUT)
app.put("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const validation = validateNotice(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { title, body, category, priority, publishDate, image } = req.body;

  if (isDatabaseConfigured()) {
    try {
      console.log(`[Database] Attempting to update notice with ID ${id} in Postgres...`);
      // Verify existence first
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Notice not found to update." });
      }

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
      console.log("[Database] Successfully updated notice ID:", id);
      return res.json(updatedNotice);
    } catch (error: any) {
      console.error(`[Database Connection Error] Failed to update notice ID ${id} in Postgres. Editing in memory-based store.`, error.message || error);
    }
  }

  // Fallback to memory-based edit
  const index = mockNotices.findIndex((n) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Notice not found to update in mock store." });
  }

  mockNotices[index] = {
    ...mockNotices[index],
    title: title.trim(),
    body: body.trim(),
    category,
    priority,
    publishDate: new Date(publishDate),
    image: image || null,
  };

  console.log("[Mock Store] Notice successfully updated in-memory:", id);
  return res.json(mockNotices[index]);
});

// 5. DELETE NOTICE (DELETE)
app.delete("/api/notices/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isDatabaseConfigured()) {
    try {
      console.log(`[Database] Attempting to delete notice with ID ${id} from Postgres...`);
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Notice not found to delete." });
      }

      await prisma.notice.delete({
        where: { id },
      });
      console.log("[Database] Successfully deleted notice with ID:", id);
      return res.json({ success: true, message: "Notice deleted successfully from database." });
    } catch (error: any) {
      console.error(`[Database Connection Error] Failed to delete notice ID ${id} from Postgres. Deleting from memory-based store.`, error.message || error);
    }
  }

  // Fallback to memory-based deletion
  const index = mockNotices.findIndex((n) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Notice not found to delete in mock store." });
  }

  mockNotices.splice(index, 1);
  console.log("[Mock Store] Notice successfully deleted from in-memory store:", id);
  return res.json({ success: true, message: "Notice deleted successfully from in-memory fallback store." });
});

export default app;
