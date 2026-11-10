# ProRoute — Production-Grade Healthcare Appointment Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tests-143%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Security-IDOR%20Protected-8A2BE2?style=for-the-badge&logo=shield&logoColor=white" alt="Security" />
</p>

ProRoute is a production-oriented, full-stack healthcare appointment and consultation platform designed to connect patients with verified doctors across multiple clinical medical specialties. Built with a **React 18 + Vite + TypeScript** frontend and a domain-driven modular **Express 5 + TypeScript** backend, it features concurrency-safe booking, mathematical interval slot expansion, multi-timezone determinism, anti-tampering credential verification, and strict IDOR/BOLA security guarantees.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 18 + Vite + Tailwind CSS v4)"]
        UI["Patient & Doctor Portals"]
        RQ["TanStack Query (React Query v5)"]
        Axios["Axios Interceptor (RFC 6819 Token Rotation)"]
        UI --> RQ --> Axios
    end

    subgraph Gateway ["API Gateway & Security Perimeters (/api/v1)"]
        RL["Global Rate Limiter (300 req / 15m)"]
        CID["Request Correlation (x-request-id)"]
        CORS["CORS & Helmet Protection"]
        Pino["Pino Structured Request Logger"]
        AuthM["Auth Middleware (Argon2id + JWT)"]
        Axios --> RL --> CID --> CORS --> Pino --> AuthM
    end

    subgraph BackendModules ["Modular Monolith (Express 5 + TypeScript)"]
        AuthMod["Auth Module (/api/v1/auth)"]
        UserMod["Users & /me Scoping (/api/v1/users)"]
        ProfMod["Professionals & Verification (/api/v1/professionals)"]
        AvailMod["Dynamic Slot Expansion Engine (/api/v1/doctor/availability)"]
        ErrH["Centralized AppError & Prisma Sanitizer"]
        AuthM --> AuthMod
        AuthM --> UserMod
        AuthM --> ProfMod
        AuthM --> AvailMod
    end

    subgraph DataStorage ["Data & Persistence Layer"]
        Prisma["Prisma ORM 5.22.0"]
        NeonDB[("PostgreSQL (AWS Neon Serverless)")]
        RedisQueue[("Redis + BullMQ (Phase 4 Planned)")]
        BackendModules --> Prisma --> NeonDB
        BackendModules -.-> RedisQueue
    end
```

---

## 🌟 Key Architecture & Engineering Features

### 1. Robust Core Authentication & RBAC (Phase 1)
- **Multi-Role RBAC:** First-class role separation (`PATIENT`, `DOCTOR`, `ADMIN`, `SUPER_ADMIN`).
- **Session Security:** Argon2id password hashing, constant-time dummy verifications to defeat timing attacks, and automatic refresh token rotation (RFC 6819) with token-reuse detection.
- **IDOR / BOLA Defense:** Private user and doctor records are strictly accessed via `/me` scoped endpoints (`/api/v1/users/me`, `/api/v1/professionals/me`, `/api/v1/doctor/availability`). Direct parameter tampering is unrouted.

### 2. Specialties Taxonomy & Doctor Licensure Verification (Phase 2)
- **Standardized Medical Taxonomy:** Specialties (`General Medicine`, `Cardiology`, `Dermatology`, `Neurology`, `Orthopedics`, `ENT`, `Pediatrics`) with administrative CRUD.
- **Doctor Credentialing Lifecycle:** Licensure numbers, medical board registration, years of clinical experience, and credential document verification workflows.
- **Anti-Fraud Security:** Credential modifications automatically reset verification status to `PENDING`. Unverified doctors are hidden from patient search.
- **Unified UI Shell:** Shared `DashboardShell.tsx` eliminating layout duplication across Doctor, Patient, and Admin portals.

### 3. Doctor Availability & Mathematical Slot Engine (Phase 3)
- **Mathematical Interval Expansion:** Slots are generated dynamically per query rather than pre-generating static database records, saving millions of rows.
- **Split-Shift Weekly Schedules:** Doctors configure daily shifts (e.g., Morning 09:00-13:00 + Evening 17:00-21:00) with custom slot durations (15, 30, 45, 60m) and buffer times (0, 5, 10, 15m).
- **Date Overrides & Blackouts:** Support for full-day holiday blackouts and custom single-day shifts that preserve configured consultation durations.
- **Multi-Timezone Determinism:** Day of week evaluated at UTC midday with DST boundary offset convergence. Supports instant browser timezone auto-detection and Clinic vs Local patient toggle.
- **Healthcare Safety Window:** Enforces a minimum 2-hour advance booking notice and a maximum 14-day discovery query horizon.

### 4. Production Hardening & Security Standards
- **Canonical API Versioning:** All endpoints strictly versioned under `/api/v1`.
- **Global Rate Limiting:** 300 requests / 15 min in production (2000 req / 15 min in dev/test) with RFC draft-7 `RateLimit-*` headers and bypass for health probes.
- **Deep Database Health Check (`GET /health`):** Probes PostgreSQL connectivity via raw SQL queries, returning 503 Service Unavailable on database disconnect.
- **Prisma Error Sanitizer:** Centralized middleware maps Prisma constraint violations (`P2002` -> 409 Conflict, `P2025` -> 404 Not Found, `P2003` -> 400 Bad Request) preventing raw internal database leaks.
- **Correlation Request IDs (`x-request-id`):** Every incoming HTTP request receives an ID tracked across headers, Pino logs, and error responses, surfaced in the client UI via `SupportReferenceCode`.
- **Graceful Shutdown:** Connection draining for in-flight requests, safe database pool disconnection, and 10-second fail-safe timers for `SIGINT` / `SIGTERM`.

---

## 📁 Repository Structure

```text
ProRoute1/
├── client/                               # Frontend Workspace (React 18 + Vite + TS)
│   ├── src/
│   │   ├── api/                          # Axios instance, interceptors, API client
│   │   ├── components/                   # Shared UI primitives, ErrorBoundary, SupportBadge
│   │   ├── lib/                          # Timezone engine, API error parsing utilities
│   │   ├── modules/
│   │   │   ├── admin/                    # Admin portal (Verifications, Specialties CRUD)
│   │   │   ├── auth/                     # Login, Registration, Password Recovery
│   │   │   ├── doctor/                   # Doctor Dashboard, Profile, Schedule Builder
│   │   │   ├── patient/                  # Patient Portal & Booking history
│   │   │   └── public/                   # Doctor Directory, Search filters, Slot Picker
│   │   ├── services/                     # Domain services (Availability, Doctor, Specialty)
│   │   └── __tests__/                    # Client Vitest suites (Timezone, Errors, Services)
│   └── package.json
├── server/                               # Backend Workspace (Express 5 + Prisma + TS)
│   ├── prisma/
│   │   ├── schema.prisma                 # Authoritative PostgreSQL schema & relations
│   │   └── migrations/                   # Sequential SQL migrations
│   ├── src/
│   │   ├── config/                       # Type-safe environment validation (Zod)
│   │   ├── lib/                          # Structured Pino logger, Argon2, JWT service
│   │   ├── middleware/                   # Auth, RequestId, RateLimit, Error Sanitizer
│   │   ├── modules/
│   │   │   ├── auth/                     # Authentication, sessions, verification tokens
│   │   │   ├── availability/             # Slot expansion service, schedule controllers
│   │   │   ├── professionals/            # Doctor profiles, verification state machine
│   │   │   ├── specialties/              # Medical specialties taxonomy
│   │   │   └── users/                    # User accounts, /me scoping
│   │   ├── services/                     # Transactional email service
│   │   ├── app.ts                        # Express application factory & middleware chain
│   │   └── server.ts                     # HTTP listener & graceful shutdown handlers
│   └── package.json
├── docs/                                 # In-depth architectural & phase documentation
│   ├── PROROUTE_MASTER_DOC.md            # Comprehensive project master specification
│   └── phases/                           # Detailed phase-by-phase design contracts
└── package.json                          # Root npm workspaces configuration
```

---

## 📡 Canonical API Endpoints (`/api/v1`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System & PostgreSQL deep health probe |
| `POST` | `/api/v1/auth/register` | Public | Patient registration with verification email |
| `POST` | `/api/v1/auth/login` | Public | Credentials authentication with HttpOnly cookies |
| `POST` | `/api/v1/auth/refresh` | Refresh Cookie | RFC 6819 silent access token rotation |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate refresh session and clear cookies |
| `GET` | `/api/v1/users/me` | Authenticated | Scoped profile of the currently logged-in user |
| `GET` | `/api/v1/specialties` | Public | List all active medical specialties |
| `GET` | `/api/v1/professionals` | Public | Filter verified doctors by specialty, city, fee |
| `GET` | `/api/v1/doctor/availability` | Doctor (`/me`) | Retrieve doctor's weekly schedules and overrides |
| `PUT` | `/api/v1/doctor/availability` | Doctor (`/me`) | Bulk update recurring schedule windows & durations |
| `POST` | `/api/v1/doctor/availability/overrides` | Doctor (`/me`) | Create date-specific custom override / blackout |
| `GET` | `/api/v1/professionals/:id/slots` | Public | Dynamic slot expansion for booking within date range |

---

## 🛠️ Tech Stack & Dependencies

| Area | Technologies |
| :--- | :--- |
| **Monorepo** | npm workspaces (`server/`, `client/`) |
| **Backend Framework** | Node.js v20+, Express 5, TypeScript 5.6+ |
| **Database & ORM** | PostgreSQL (AWS Neon Serverless), Prisma ORM 5.22.0 |
| **Frontend Framework** | React 18, Vite 5, TypeScript, React Router 6 |
| **State & Data Fetching** | TanStack Query (React Query) v5, Axios |
| **Styling & UI Components**| Tailwind CSS v4, Lucide React, Radix UI Primitives |
| **Security & Hashing** | Argon2id, JsonWebToken, Helmet, Cookie-Parser, Zod |
| **Rate Limiting & Telemetry**| `express-rate-limit`, Pino, Pino-HTTP, `x-request-id` |
| **Automated Testing** | Vitest 2.1.9, Supertest 7, React Testing Library |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: Local instance or cloud database (e.g., [Neon Serverless](https://neon.tech))
- **npm**: `v9.x` or higher

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```bash
cp server/.env.example server/.env
```

Ensure the following variables are configured:
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
# Generate Prisma Client
npm run --workspace=server prisma:generate

# Apply production migrations
npm run --workspace=server prisma:migrate:prod
```

### 5. Running Development Servers
Run backend and frontend concurrently:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing Suite

ProRoute enforces rigorous automated testing covering authentication flows, security boundaries, slot calculations, and timezone determinism.

```bash
# Run server Vitest test suite (22 test suites | 122 tests)
npm run test:server

# Run client Vitest test suite (6 test suites | 21 tests)
npm run test:client

# Production client type-check and bundle build
npm run build:client
```

**Total Test Coverage:** 28 test files / 143 tests passing.

---

## 🗺️ Project Roadmap

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

---

## 🔒 Security & Healthcare Compliance

- **HIPAA-Conscious Data Partitioning:** All health data and doctor-patient interactions are strictly verified at the database transaction layer.
- **Zero Raw Error Leakage:** Database internal details, stack traces, and SQL queries are scrubbed in production.
- **Audit Traceability:** Every log line is stamped with ISO timestamps and correlation IDs (`x-request-id`).
