# Not-lify (my-notes)

A full-stack notes app: create, organize, tag, favorite, and archive notes, with folders, search, and Google or email/password sign-in.

## Stack

**Backend** (`backend/`) — Express 5 · TypeScript · Prisma 7 (`@prisma/adapter-pg`) · PostgreSQL (Neon) · Redis · JWT auth · Zod validation

**Frontend** (`frontend/`) — React 18 · TypeScript · Vite · HeroUI · Tailwind CSS 4 · TanStack Query · React Router · Axios

## Features

- Email/password auth (JWT) and Google OAuth sign-in
- Notes with title, content, pin, archive, and favorite states, with autosave in the editor
- Folders and tags for organizing notes, with search and tag filtering
- Favorites and Archive views
- Responsive layout: sidebar + header on desktop, bottom nav on mobile
- Account/appearance/sync/data settings

## Project layout

```
backend/
  src/
    routes/       Express routers (auth, notes, tags, folders, favorites)
    services/     Business logic + Prisma queries
    middleware/   JWT auth guard, Zod validation, error handler
    config/       Prisma client, Redis client
    schemas/      Zod request schemas
  prisma/schema.prisma

frontend/
  src/
    pages/        Route-level screens (Home, Notes, Folder, Tags, Archive, Favorites, Auth, Settings, ...)
    components/   Reusable UI (note editor, cards, navigation, settings panels)
    api/          Axios calls per resource
    hooks/        TanStack Query hooks (queries/mutations) per resource
    contexts/      Auth context (token/user state)
```

## Prerequisites

- Node.js
- A PostgreSQL database (project is set up for [Neon](https://neon.tech))
- A Redis instance reachable locally or remotely (used for JWT blacklisting on logout and by the auth guard on every protected route)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`):

```
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="a-long-random-secret"
JWT_EXPIRES_IN="1d"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
CORS_ORIGIN="https://not-lify.vercel.app"
PORT=5000
```

Generate the Prisma client and push the schema to your database:

```bash
npm run db:generate
npm run db:push       # or: npm run db:migrate
```

For deployments where the platform sets `NODE_ENV=production` before building,
install dev dependencies during the build step so TypeScript can find Node types:

```bash
npm install --include=dev && npx prisma generate && npm run build
```

Start the API:

```bash
npm run dev            # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Start the dev server:

```bash
npm run dev             # http://localhost:5176
```

## Scripts

**Backend**: `dev`, `build`, `start`, `db:generate`, `db:push`, `db:migrate`, `db:studio`

**Frontend**: `dev`, `build`, `lint`, `preview`

## Known issues

- `Header.tsx` and `theme-switch.tsx` use HeroUI compound-component APIs and an icon import path that don't match the installed `@heroui/react` version — both fail to build.
- `FavoritesPage.tsx` passes `onClick`/`onToggleFavorite` to `NoteCard`, which doesn't accept either prop, so favorited notes aren't clickable and can't be un-favorited from that page.
- `backend/src/controllers/notesController.ts` and `backend/src/db/notes.db.ts` are dead code from before the Prisma migration and don't compile; they aren't imported anywhere and can be deleted.
