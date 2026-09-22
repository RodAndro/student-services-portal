# Student Information Management — REST API + Web Frontend

This repository contains the **Student Information Management** system, delivered as two projects
plus the documentation that ties them together:

| Path | What it is |
| --- | --- |
| [`student-api/`](student-api/README.md) | The backend — a **Laravel 12 + Laravel Sanctum REST API** versioned under `/api/v1` (MySQL). |
| [`student-web/`](student-web/README.md) | The frontend — a **React 19 + Vite + TypeScript** single-page app that consumes the REST API over HTTP. |
| [`docs/`](docs/) | Cross-project documentation: the exhaustive API contract and the backend-vs-frontend requirements map. |
| [`src/`](src/) | A small **legacy TypeScript sample** (Activity I status formatter). Not part of the API or frontend. |

The REST API is the authoritative backend; the web client is a thin consumer that treats the API as
the source of truth (no database connection, no mock API, no invented endpoints).

## Getting started

Each project has its own setup. Follow the project README for the part you need:

- **Backend (REST API):** see [`student-api/README.md`](student-api/README.md)
  - `composer install` → `cp .env.example .env` → `php artisan key:generate`
  - create the MySQL database, then `php artisan migrate:fresh --seed`
  - `php artisan serve` → API at `http://127.0.0.1:8000/api/v1`
- **Frontend:** see [`student-web/README.md`](student-web/README.md)
  - `npm install` → `npm run dev` → app at `http://localhost:5173`
  - the Vite dev proxy forwards `/api/*` to the Laravel backend

## Testing

- **Backend:** `php artisan test` (from `student-api/`). Requires a MySQL `student_api_testing`
  database (see [`student-api/README.md`](student-api/README.md)).
- **Frontend:** `npm test` (from `student-web/`). Uses Vitest + Testing Library against a mocked
  HTTP boundary; no database needed.

## Documentation

- API reference / contract: [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md)
- Live OpenAPI docs (backend running): `http://127.0.0.1:8000/api/docs`
- Backend ERD: [`student-api/docs/ERD.md`](student-api/docs/ERD.md)
- Frontend architecture / AI log: [`student-web/docs/`](student-web/docs/)

## AI-assisted development

This project was built with an instructor-approved AI coding assistant in small, verifiable phases.
The authoritative records are:

- Backend AI usage & verification: [`student-api/README.md`](student-api/README.md) ("AI Tools Used"
  and "How AI-Generated Code Was Reviewed and Verified").
- Frontend AI development log: [`student-web/docs/AI-DEVELOPMENT-LOG.md`](student-web/docs/AI-DEVELOPMENT-LOG.md).
- Top-level summary: [`AI_LAB_NOTEBOOK.md`](AI_LAB_NOTEBOOK.md).
