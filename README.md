# Menu Management Platform

A full-stack menu management platform composed of a NestJS + Prisma API and a Next.js/Tailwind UI. It allows administrators to explore and edit hierarchical menu trees, add, update, and delete items, and view nested structures with instant feedback.

## Features

- **Nested menu explorer**  interactive tree with expand/collapse, add/delete, and detail editing panel.
- **Menu filtering**  choose any menu or menu item as the current tree root via the dropdown selectors.
- **Responsive layout**  sidebar navigation (with mobile drawer), two-column editor layout on desktop, coming-soon placeholders for unfinished sections.
- **State management**  global Redux store keeps menus/items in sync while preserving separate selection state for navigation and editor contexts.
- **Backend API**  NestJS REST service using Prisma ORM for PostgreSQL with seeding support.

## Tech Stack

| Layer      | Technologies |
|------------|--------------|
| Frontend   | Next.js 14 (App Router), React 18, Tailwind CSS, Redux Toolkit |
| Backend    | NestJS 10, Prisma, PostgreSQL |
| Tooling    | pnpm workspace, TypeScript, ESLint/Prettier |

## Prerequisites

- **Node.js** = 18
- **pnpm** = 8 (`npm install -g pnpm`)
- **PostgreSQL** database (local or cloud). Update connection string in `apps/backend/.env`.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Benardo07/menu-management.git
cd menu-management
```

### 2. Install dependencies

```bash
pnpm install
```

This installs packages for both `apps/frontend` and `apps/backend` via the workspace configuration.

### 3. Configure environment variables

#### Backend (`apps/backend/.env`)

Create `.env` (or adjust the existing sample) with at least:

```
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=8080
```

Optionally run `pnpm --filter backend prisma migrate dev` to apply/schema migrations and `pnpm --filter backend seed` to seed initial data.

#### Frontend (`apps/frontend/.env`)

```
BACKEND_API_URL=http://localhost:8080
```

Ensure the URL matches the backend origin used locally.

### 4. Run the backend

```bash
pnpm --filter backend start:dev
```

This starts the NestJS API at `http://localhost:8080` (change via `PORT`).

### 5. Run the frontend

```bash
pnpm --filter frontend dev
```

Launches the Next.js dev server at `http://localhost:3000`.

### 6. Visit the app

Open `http://localhost:3000` to use the menu management dashboard. The root page renders the Menus experience (no `/menus` path required).

## Useful Commands

| Target | Command | Description |
|--------|---------|-------------|
| Frontend | `pnpm --filter frontend dev` | Start Next.js with Turbopack |
| Frontend | `pnpm --filter frontend build` | Build production bundle |
| Frontend | `pnpm --filter frontend start` | Run production server (after build) |
| Backend | `pnpm --filter backend start:dev` | Start NestJS API (default watch mode) |
| Backend | `pnpm --filter backend build` | Compile Nest project to `dist/` |
| Backend | `pnpm --filter backend prisma migrate dev` | Apply Prisma migrations |
| Backend | `pnpm --filter backend seed` | Seed database with sample data |

## Project Structure

```
apps/
 backend/   # NestJS + Prisma REST API
   src/   # Modules, controllers, services, DTOs
   prisma/# Schema & seed scripts    .env   # DB connection and port
 frontend/  # Next.js App Router UI
     src/app/         # Pages, layout, API routes
     src/components/  # Sidebar, tree view, forms, icons
     src/screens/     # Menus screen (main feature)
     src/lib/         # Redux store, slices, utilities
```

## Author

**Benardo**  
benardo188@gmail.com

