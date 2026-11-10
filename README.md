# ProRoute — Production-Grade Healthcare Appointment Platform

ProRoute is a production-oriented, full-stack healthcare appointment platform designed to connect patients with verified doctors across multiple clinical medical specialties. It pairs a **React 18 + Vite + TypeScript** frontend with a domain-oriented modular **Express 5 + TypeScript** backend, featuring concurrency-safe scheduling, anti-tampering doctor credential verification, and strict IDOR/BOLA security guarantees.

---

## 🌟 Architecture & Key Features

### 1. Robust Core Authentication & RBAC (Phase 1)
- **Multi-Role RBAC:** First-class role enforcement (`PATIENT`, `DOCTOR`, `ADMIN`, `SUPER_ADMIN`).
- **Session Security:** Argon2id password hashing, constant-time dummy verify to defeat timing attacks, and automatic refresh token rotation (RFC 6819) with token-reuse detection.
- **IDOR / BOLA Defense:** Private user and doctor records are strictly accessed via `/me` scoped endpoints (`/api/v1/users/me`, `/api/v1/professionals/me`). Direct parameter tampering is unrouted.

### 2. Specialties Taxonomy & Doctor Licensure Verification (Phase 2)
- **Standardized Medical Taxonomy:** Specialties (`General Medicine`, `Cardiology`, `Dermatology`, `Neurology`, `Orthopedics`, `ENT`, `Pediatrics`) with administrative CRUD.
- **Doctor Credentialing:** Licensure numbers, medical board registration, years of clinical experience, and credential document verification lifecycle.
- **Anti-Fraud Security:** Credential modifications automatically reset verification status to `PENDING`. Unverified doctors are hidden from patient search.
- **Unified UI Shell:** Shared `DashboardShell.tsx` eliminating layout duplication across Doctor, Patient, and Admin portals.

### 3. Doctor Availability & Slot Management Engine (Phase 3)
- **Mathematical Interval Expansion:** Slots are generated dynamically per query rather than pre-generating static database records, saving millions of rows.
- **Split-Shift Weekly Schedules:** Doctors configure daily shifts (e.g., Morning 09:00-13:00 + Evening 17:00-21:00) with custom slot durations (15, 30, 45, 60m) and buffer times (0, 5, 10, 15m).
- **Date Overrides & Blackouts:** Support for full-day holiday blackouts and custom single-day shifts that preserve configured consultation durations.
- **Timezone Determinism:** Day of week evaluated at UTC midday with DST boundary offset convergence.
- **Healthcare Safety Window:** Enforces a minimum 2-hour advance booking notice and a maximum 14-day discovery query horizon.

### 4. Production Hardening & Standards Compliance
- **Canonical API Versioning:** All endpoints strictly versioned under `/api/v1`.
- **Deep Database Health Check (`GET /health`):** Probes PostgreSQL connectivity via raw SQL queries, returning 503 Service Unavailable on database disconnect.
- **Prisma Error Sanitizer:** Centralized middleware maps Prisma constraint violations (`P2002` -> 409 Conflict, `P2025` -> 404 Not Found, `P2003` -> 400 Bad Request) preventing raw internal database leaks.
- **Correlation Request IDs:** Every incoming HTTP request receives an `x-request-id` tracked across headers, Pino logs, and error responses.
- **Graceful Shutdown:** Connection draining for in-flight requests, safe database pool disconnection, and 10-second fail-safe timers for `SIGINT` / `SIGTERM`.

---

## 🛠️ Tech Stack

- **Monorepo:** npm workspaces (`server`, `client`)
- **Backend:** Node.js v20+, Express 5, TypeScript 5.6+
- **Database & ORM:** PostgreSQL (AWS Neon Serverless), Prisma ORM 5.22.0
- **Frontend:** React 18, Vite 5, TypeScript, React Router 6, TanStack Query v5, Tailwind CSS v4, Lucide React
- **Logging & Security:** Pino, Pino-HTTP, Helmet, Cookie-Parser, Zod, Argon2
- **Testing:** Vitest 2.1.9, Supertest 7, React Testing Library

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v20.x or higher
- PostgreSQL database (Neon Serverless or local instance)

### 2. Environment Configuration
Create a `.env` file in `server/` based on `server/.env.example`:
```bash
cp server/.env.example server/.env
```

Ensure the following variables are set:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_ACCESS_SECRET="your-32-character-minimum-access-secret"
JWT_REFRESH_SECRET="your-32-character-minimum-refresh-secret"
CORS_ORIGIN="http://localhost:5173"
CLIENT_URL="http://localhost:5173"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Migrations
```bash
npm run --workspace=server prisma:generate
npm run --workspace=server prisma:migrate:prod
```

### 5. Running the Application
Run both backend and frontend concurrently:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

---

## 🧪 Running Automated Tests

```bash
# Run server Vitest test suite (21 test files / 120 tests)
npm run test:server

# Run client Vitest test suite (4 test files / 13 tests)
npm run test:client

# Production client build check
npm run build:client
```

---

## 🗺️ Project Roadmap Status

- [x] **Phase 1: Architecture Foundation & Core Authentication** (Completed)
- [x] **Phase 2: Specialties & Professional Doctor Verification** (Completed)
- [x] **Phase 3: Doctor Availability & Slot Management** (Completed)
- [ ] **Phase 4: Concurrency-Safe Booking & Lifecycle State Machine** (Next)
- [ ] **Phase 5: Payment Strategy, Webhooks & Idempotency**
- [ ] **Phase 6: Private Medical Document Management with Amazon S3**
- [ ] **Phase 7: Real-Time Authenticated In-Appointment Communication**
- [ ] **Phase 8: Constrained AI Triage & Specialist Routing**
- [ ] **Phase 9: Role-Based Dashboards & Patient/Doctor Portal Polish**
- [ ] **Phase 10: Security Hardening, Automated E2E Testing Suite & Observability**

