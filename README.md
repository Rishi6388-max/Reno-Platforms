# Interactive Notice Board

A modern, full-stack, and responsive digital notice board application designed for academic and corporate environments. This application features dynamic notice publishing, categorization, priority-based sorting, and a robust search mechanism with intelligent filter synchronization.

---

## 🚀 Live Demo
Access the production application directly on Vercel:
👉 **[Interactive Notice Board Live Deployment](https://reno-platforms-rho.vercel.app/)**

---

## ✨ Features

- **Dynamic Content Management**: Create, view, update, and delete notices instantly with support for custom body copy, priority states, categories, and image attachments.
- **Smart Filter Synchronization**:
  - Automatically resets search text when changing categories or priority tabs to keep the user view relevant.
  - Implements **Conflict Resilient Search**: If tab criteria clash with a custom search term, the application temporarily bypasses tab boundaries to show the search results globally, displaying an intuitive banner to reset conflicting tabs.
  - Generous "Clear Filters" button to reset the search string, category tab, and priority status at once.
- **Resilient Fallback Mode**: If the PostgreSQL database is unconfigured or undergoing maintenance, the backend automatically transitions to a persistent in-memory mock store, preventing runtime downtime.
- **Optimized for Serverless**: Configured for Vercel Serverless Functions with a lazy-loaded Prisma Client wrapper, resolving cold-start module errors and cross-platform native binary targets dynamically.

---

## 🛠️ Technology Stack

- **Frontend**:
  - **React 18** & **Vite**: Rapid, lightweight Single Page Application build toolchain.
  - **Tailwind CSS**: Modern utility-first CSS styling for a highly responsive, clean visual hierarchy.
  - **Lucide React**: Clean and minimal icon designs.
- **Backend**:
  - **Node.js** with **Express**: Clean, standard RESTful API routing.
  - **TypeScript**: Full static type safety across client and server.
- **Database & DevOps**:
  - **Prisma Client & ORM**: Type-safe query generation and relational database migration paths.
  - **PostgreSQL**: Highly structured, reliable persistent storage.
  - **Vercel Serverless**: Configured with custom routing rules (`vercel.json`) and specific RHEL OpenSSL binary engines.

---

## 📋 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory of your project:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/notice_board?schema=public"
```

### 3. Generate Database Client & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 📦 Deployment on Vercel

This repository is pre-configured with a custom `vercel.json` descriptor to route API and frontend requests smoothly:

- Frontend single-page routes fallback safely to `index.html`.
- Backend endpoints inside `/api` directory are compiled as serverless lambdas.
- Relational schema configuration handles binary targets native to Vercel's Amazon Linux runtime (`rhel-openssl-3.0.x`).
