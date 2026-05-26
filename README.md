# ExpenseTrack

A modern multi-tenant expense tracking platform built with enterprise-grade security, real-time analytics, and a fully theme-aware UI.

The project was designed around four core principles:

* **Accurate financial calculations** — `BigDecimal` end-to-end with INR-safe formatting
* **Secure-by-default authentication** — JWT in HttpOnly cookies, BCrypt password hashing, RBAC authorization, audit logging
* **Real production-style architecture** — multi-tenant SaaS design, tenant isolation, no mock data fallbacks
* **Modern UX** — responsive dashboard with light/dark themes from day one

---

# 🚀 Features

## 📊 Dashboard

* KPI tiles with month-over-month deltas
* Expense trend analytics
* Spending-by-category donut chart
* Recent expenses feed
* Budget alerts
* Audit-driven activity timeline

## 💰 Expenses

* Searchable & sortable expense table
* Advanced filter bar
* Date-range picker
* CSV/PDF export
* Create/Edit expense modal

## 🗂 Categories

* Grid & list layouts
* Search, sort & type filtering
* Icon picker
* Per-category budget tracking

## 📈 Budgets

* Monthly budget limits
* Progress ring indicators
* Near-limit & over-budget alerts
* End-of-month spending forecast

## 📑 Reports

* Monthly & yearly analytics
* 6-metric summary dashboard
* Category spending insights
* Day-of-week expense analysis
* Top-expense ranking table

## 👥 User Management

* Admin-only user management
* Role & status filters
* MFA-ready user badges

## 🏢 Multi-Tenant SaaS Architecture

* Row-level tenant isolation
* Shared database architecture
* Tenant-aware backend filtering
* Company-level access control
* SUPER_ADMIN / COMPANY_ADMIN / VIEWER roles
* Cross-tenant access protection

## 🔒 Security & Audit

* JWT access & refresh tokens
* HttpOnly + Secure cookie authentication
* Refresh token rotation
* `@PreAuthorize` endpoint protection
* Full audit logging for CREATE / UPDATE / DELETE actions
* Ownership validation for all mutations

## 🎨 UI/UX

* Fully responsive dashboard
* Light & dark theme support
* Theme persistence without flash reload
* Custom UI primitives
* Real-time budget notifications

---

# 🛠 Tech Stack

## Backend

* Spring Boot 3.2.5 (Java 21)
* Spring Security
* Spring Data JPA
* Hibernate 6
* PostgreSQL
* Flyway
* JWT (jjwt 0.12)
* MapStruct
* OpenAPI / Swagger UI
* iText PDF
* Lombok

## Frontend

* React 18
* TypeScript 5
* Vite 5
* Tailwind CSS 3
* TanStack Query
* React Hook Form + Zod
* React Router 6
* Recharts
* date-fns
* axios
* sonner
* lucide-react

---

# 🏗 Architecture Highlights

## Authentication

* JWT access & refresh token flow
* HttpOnly + Secure cookie storage
* Refresh token rotation
* Revoke-all sessions on password change

## Authorization

* Role-based access control using `@PreAuthorize`
* ADMIN write protection
* Authenticated read access

## Multi-Tenancy

* TenantContext using ThreadLocal storage
* Tenant-aware request filtering
* Company-scoped queries
* Ownership verification on every mutation

## Audit Logging

* AOP-based entity change tracking
* Stores actor, action, entity ID, old/new JSON snapshots

## Financial Precision

* `BigDecimal` monetary handling
* Precision-safe serialization
* Float drift prevention

## Database

* PostgreSQL with Flyway-managed migrations
* `ddl-auto: validate` for production-safe schema validation

## Theming

* CSS variable-driven Tailwind theme system
* Persistent dark/light mode
* No flash on theme switch

---

# 📌 Project Goals

This project was built to explore:

* Enterprise SaaS architecture
* Secure multi-tenant backend systems
* Scalable frontend dashboard design
* AI-assisted development workflows
* Production-style authentication & authorization patterns

---

# ⚡ Future Improvements

* Docker support
* CI/CD pipeline
* Redis caching
* Real-time notifications
* Cloud deployment
* Advanced analytics
* Microservices migration

---

# 📚 AI-Assisted Development

This project was developed with AI-assisted workflows using Claude AI while maintaining full developer-driven architecture, security, and business logic decisions.
