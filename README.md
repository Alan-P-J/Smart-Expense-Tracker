# ExpenseTrack

A team expense tracker built around four hard requirements: **honest money math**
(`BigDecimal` end-to-end, `toLocaleString('en-IN', { style: 'currency', currency: 'INR' })`),
**safe-by-default auth** (JWT in HttpOnly cookies, BCrypt-hashed passwords, ADMIN/VIEWER
role split, full audit log on every write), **real data** (no mock fallbacks — every
dashboard tile and chart reads from a real endpoint), and **theme-aware UI** that ships
both light and dark modes from day one.

## Features

- **Dashboard** — KPI tiles with month-over-month deltas, expense trend chart, spending-by-category donut, recent expenses, budget alerts, audit-driven activity feed
- **Expenses** — searchable + sortable table with filter bar, date-range picker, CSV/PDF export, create/edit modal
- **Categories** — grid + list views, type filter, search, sort, icon picker, per-category budget progress
- **Budgets** — monthly limits with progress ring, near-limit / over-budget alerts, projected end-of-month forecast
- **Reports** — year/month filter, 6-metric summary strip, monthly bar chart, category donut, day-of-week chart (Mon–Sun), top-expenses ranked table
- **Users** — admin-only user management, role/status filters, MFA-ready badges
- **Audit log** — every CREATE/UPDATE/DELETE captured server-side, surfaced in the activity feed and a dedicated page
- **Profile + Settings** — change-password form, theme toggle, session sign-out
- **Custom UI primitives** — themed date picker, icon picker, period select, notification bell with real budget alerts

## Tech stack

**Backend** — Spring Boot 3.2.5 (Java 21) · Spring Security · Spring Data JPA · Hibernate 6 · PostgreSQL · Flyway 10.10.0 (override) · JWT (jjwt 0.12) · MapStruct · OpenAPI/Swagger UI · iText PDF · Lombok

**Frontend** — React 18 · TypeScript 5 · Vite 5 · Tailwind CSS 3 (CSS-var theme tokens) · TanStack Query · React Hook Form + Zod · React Router 6 · Recharts · date-fns · axios · sonner · lucide-react

## Architecture

- **Auth** — JWT access + refresh tokens, both stored in HttpOnly + Secure cookies; refresh rotation; revoke-all on password change
- **Authorization** — `@PreAuthorize` on every mutating endpoint (`hasAuthority('ADMIN')` for writes, `isAuthenticated()` for reads)
- **Audit** — AOP advice records every entity-level write to `audit_log` with the actor, action, entity ID and old/new JSON snapshots
- **Money** — `BigDecimal` columns (`precision = 12, scale = 2`), serialized as strings to avoid float drift on the wire
- **DB** — Postgres, Flyway-managed schema (V1 init, V2 seed); production runs `ddl-auto: validate` against migrations
- **Theming** — CSS variables drive Tailwind utility colours, so `bg-card` / `text-accent` swap with one `<html class="dark">` toggle (persisted in `localStorage`, no flash on load)
