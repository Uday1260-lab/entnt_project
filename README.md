# TalentFlow (Front-end only)

A React-based mini hiring platform with local persistence and a simulated REST API. No backend required.

## Features

- Jobs
  - Paginated and filterable jobs list (title/slug/tags, status)
  - Create/Edit (basic), archive/unarchive
  - Drag-and-drop reorder with optimistic updates and rollback on failure
  - Deep link to a job `/jobs/:jobId`
- Candidates
  - 1,000+ seeded candidates
  - Virtualized list with search (name/email) and stage filter
  - Candidate profile with timeline of status changes `/candidates/:id`
  - Kanban board to move candidates across stages (drag-and-drop)
  - Notes with @mentions (rendering stub)
- Assessments
  - Per-job assessment builder with sections and question types (single/multi choice, short/long text, numeric with range, file upload stub)
  - Live preview as a fillable form
  - Persist builder state and responses locally
  - Runtime validation (required, numeric range, max length) and simple conditional capability placeholder
- Data & API
  - MirageJS simulates REST endpoints
  - IndexedDB via Dexie for durable local persistence (write-through in route handlers)
  - Artificial latency (200–1200ms) and 5–10% error rate on write endpoints

## Tech Stack

- React + Vite (JavaScript)
- React Router v6
- @tanstack/react-query
- MirageJS
- Dexie (IndexedDB)
- @dnd-kit for drag-and-drop
- react-window for virtualization
- Tailwind CSS

## Getting started

Prerequisites: Node.js 18+

Install dependencies and run the dev server:

```cmd
npm install
npm run dev
```

Then open the URL printed by Vite (typically http://localhost:5173).

Build for production:

```cmd
npm run build
npm run preview
```

## Architecture

- `src/mirage/*`: Mirage server, routes, seeds, and utilities
- `src/persistence/db.js`: Dexie database schema and helpers
- `src/api/client.js`: Small `fetch` wrapper
- `src/hooks/*`: Data hooks powered by React Query
- `src/pages/*`: Route pages for jobs, candidates, pipeline, assessment builder
- `src/components/shared/*`: Shared UI components

Mirage routes read/write through Dexie, acting as the "network" layer but persisting data locally. On first run, seeds populate the DB. State is preserved across refreshes since Dexie stores in IndexedDB.

## Known gaps and next steps

- Jobs: add dedicated edit modal with form validation for slug uniqueness within UI (API already validates)
- Assessments: add conditional logic UI and runtime evaluation
- Notes with @mentions: add suggestions dropdown and persistence
- Add unit tests and integration tests
- Optional GitHub Pages workflow for deployment

## License

MIT
