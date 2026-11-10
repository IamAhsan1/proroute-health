# ProRoute — Master Engineering & System Architecture Specification

**Project Name:** ProRoute Healthcare Platform  
**Repository:** [github.com/IamAhsan1/proroute-health](https://github.com/IamAhsan1/proroute-health)  
**Author:** Senior Backend & Architecture Team  
**Architecture Style:** Domain-Oriented Modular Monolith (Microservices-Ready)  

---

## Table of Contents
1. [Project Overview & Core Value](#1-project-overview--core-value)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture & Scalability Blueprint](#3-system-architecture--scalability-blueprint)
4. [Phased Engineering Roadmap](#4-phased-engineering-roadmap)
5. [Completed Milestones](#5-completed-milestones)
   - [Phase 1: Architecture Foundation, Auth & Security Hardening](#phase-1-architecture-foundation-auth--security-hardening)
   - [Phase 2: Specialties & Professional Doctor Verification](#phase-2-specialties--professional-doctor-verification)
   - [Phase 3: Doctor Availability & Weekly Slot Management](#phase-3-doctor-availability--weekly-slot-management)
6. [Architectural Hardening & Production Reliability](#6-architectural-hardening--production-reliability)
   - [Canonical REST API Versioning (`/api/v1`)](#canonical-rest-api-versioning-apiv1)
   - [Deep Health Checks & Neon Database Probing](#deep-health-checks--neon-database-probing)
   - [Centralized Prisma Error Sanitization](#centralized-prisma-error-sanitization)
   - [Distributed Request & Correlation Tracking (`x-request-id`)](#distributed-request--correlation-tracking-x-request-id)
   - [Zero-Downtime Enterprise Graceful Shutdown](#zero-downtime-enterprise-graceful-shutdown)
7. [Upcoming Milestone Previews](#7-upcoming-milestone-previews)
   - [Phase 4: Concurrency-Safe Booking & Lifecycle State Machine](#phase-4-concurrency-safe-booking--lifecycle-state-machine)
   - [Phase 5: Payment Strategy, Webhooks & Idempotency](#phase-5-payment-strategy-webhooks--idempotency)
   - [Phase 6: Private Medical Document Management with Amazon S3](#phase-6-private-medical-document-management-with-amazon-s3)
   - [Phase 7: Real-Time Authenticated In-Appointment Communication](#phase-7-real-time-authenticated-in-appointment-communication)
   - [Phase 8: Constrained AI Triage & Specialist Routing](#phase-8-constrained-ai-triage--specialist-routing)
8. [Observability, Logging & Security Policies](#8-observability-logging--security-policies)
9. [Exporting to PDF or Word](#9-exporting-to-pdf-or-word)

---

## 1. Project Overview & Core Value

**ProRoute** is a production-oriented, full-stack healthcare platform engineered to connect patients with verified doctors across medical specialties. 

### Core Value Proposition:
> **Concurrency-safe, IDOR/BOLA-protected healthcare scheduling and consultations with strictly constrained AI triage routing and reliable transactional guarantees.**

Healthcare platforms demand higher standards of engineering than typical consumer apps:
- **Zero Double-Bookings:** Concurrency race conditions during doctor slot bookings must be impossible at the database layer via PostgreSQL transactions.
- **Strict Privacy & IDOR Immunity:** Medical documents, consultation notes, availability configurations, and private profiles must never be accessible across unauthorized user boundaries (enforced via server-side `/me` scoping).
- **Constrained AI Guardrails:** AI triage must never hallucinate diagnoses or bypass clinical specialties; emergency red-flags (e.g. chest pain) must immediately trigger emergency disclaimers.

---

## 2. Technology Stack

| Layer | Technologies | Justification |
|---|---|---|
| **Backend Core** | Node.js (v20+), Express 5, TypeScript 5.6+ | High I/O performance, strong static typing, modern route handling |
| **Database & ORM** | PostgreSQL 16 (AWS Neon Serverless), Prisma ORM (v5.22.0) | Strict ACID compliance, relational integrity, clean type-safe query generation |
| **Vector Search** | PostgreSQL `pgvector` extension | High-dimensional embedding lookups for clinical specialty routing |
| **Asynchronous Queues** | Redis + BullMQ (Phases 4–6) | 15-minute slot reservation expiration, reminder workers, background jobs |
| **Object Storage** | Amazon S3 (Phase 6) | Encrypted private medical document storage accessed exclusively via presigned URLs |
| **Realtime** | Socket.IO / WebSockets (Phase 7) | Low-latency in-appointment communication and consultation signaling |
| **Frontend Core** | React 18, Vite 5, TypeScript | Modern component architecture, fast build cycles, bundle optimization |
| **Client State & Network**| TanStack Query (React Query) v5, Axios Interceptors | Intelligent server caching, background re-fetching, automated silent token refresh |
| **Design System** | Tailwind CSS v4, Lucide React, Radix UI | Modern, accessible, responsive healthcare interface |
| **Security & Cryptography**| Argon2id (RFC 9106), JSON Web Tokens (RFC 7519) | State-of-the-art password hashing and dual-token session management |
| **Observability** | Pino Structured Logger with `x-request-id` | Ultra-low overhead JSON logging with automated credential redaction and correlation IDs |
| **Testing** | Vitest 2.1.9, Supertest 7, Testing Library | High-speed unit and integration test verification across backend and client |

---

## 3. System Architecture & Scalability Blueprint

ProRoute utilizes a **Domain-Oriented Modular Monolith** architecture. All code lives within cohesive business domain modules rather than technical layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│            (React + Vite Web App / Mobile Web)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (/api/v1/*) / WSS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  ProRoute Express Backend                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security Gateway: Helmet, CORS, Cookie-Parser,        │  │
│  │ Pino HTTP Logger, x-request-id, Rate Limiters         │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│       ┌──────────────────────┼──────────────────────┐       │
│       ▼                      ▼                      ▼       │
│ ┌───────────┐          ┌───────────┐          ┌───────────┐ │
│ │   Auth    │          │   Users   │          │  Doctor   │ │
│ │  Module   │          │  Module   │          │Taxonomy & │ │
│ │ (Argon2,  │          │(Profile,  │          │Verif.     │ │
│ │  JWT,     │          │ IDOR /me) │          │(Phase 2)  │ │
│ │  OAuth)   │          └───────────┘          └───────────┘ │
│ └───────────┘                │                      │       │
│       │                      │                      ▼       │
│       │                      │                ┌───────────┐ │
│       │                      │                │Availabil. │ │
│       │                      │                │  Module   │ │
│       │                      │                │ (Phase 3) │ │
│       │                      │                └─────┬─────┘ │
│       │                      │                      │       │
│       ▼                      ▼                      ▼       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Prisma ORM Data Access Layer             │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             PostgreSQL Database (AWS Neon Serverless)       │
│        (Tables, B-Tree Unique Indexes, CASCADE FKs)         │
└─────────────────────────────────────────────────────────────┘
```

### Microservices Evolution Strategy:
Because modules are strictly partitioned (`routes -> controller -> service -> repository`) with zero direct cross-module database coupling:
- When traffic scales to 100,000+ daily consultations, any module (e.g. `modules/auth`, `modules/availability`, `modules/appointments`) can be extracted into an independent microservice behind an API Gateway with zero business logic rewrites.

---

## 4. Phased Engineering Roadmap

ProRoute follows a 10-phase Full-Stack Vertical Slice milestone execution plan (each phase delivers both core backend APIs and rich frontend user interfaces):

| Phase | Milestone Name | Architecture Scope | Status | Artifact Reference |
|---|---|---|---|---|
| **01** | Architecture Foundation, Core Auth & Security | Backend + Auth UI Slice | **COMPLETED (100% Verified)** | [`docs/phases/phase-01-auth-security.md`](./phases/phase-01-auth-security.md) |
| **02** | Specialties & Professional Doctor Verification | Backend + Directory/Profile/Admin UI | **COMPLETED (100% Verified)** | [`docs/phases/phase-02-specialties-verification.md`](./phases/phase-02-specialties-verification.md) |
| **03** | Doctor Availability & Weekly Slot Management | Backend + Slot Picker Calendar UI | **COMPLETED (100% Verified)** | [`docs/phases/phase-03-doctor-availability-scheduling.md`](./phases/phase-03-doctor-availability-scheduling.md) |
| **04** | Concurrency-Safe Booking & Lifecycle State Machine | Backend + Booking Workflow UI | Planned | Roadmap Phase 4 |
| **05** | Payment Strategy, Webhooks & Idempotency | Backend + Checkout & Receipt UI | Planned | Roadmap Phase 5 |
| **06** | Private Medical Document Management with Amazon S3 | Backend + S3 Document Vault UI | Planned | Roadmap Phase 6 |
| **07** | Real-Time Authenticated In-Appointment Communication | Socket.IO + Consultation Chat UI | Planned | Roadmap Phase 7 |
| **08** | Constrained AI Triage & Specialist Routing | Python / Node AI Service + Intake Wizard UI | Planned | Roadmap Phase 8 |
| **09** | Role-Based Dashboards & Patient/Doctor Portal Polish | Integrated Patient Hub, Doctor Portal & Admin Control | Planned | Roadmap Phase 9 |
| **10** | Security Hardening, Automated E2E Testing & Observability | Full-Stack E2E Hardening & Monitoring | Planned | Roadmap Phase 10 |

---

## 5. Completed Milestones

### Phase 1: Architecture Foundation, Auth & Security Hardening
- **Completed:** 2026-10-22
- **Detailed Report:** See [Phase 1 Specification Document](./phases/phase-01-auth-security.md).
- **Key Highlights:**
  - Full Argon2id memory-hard password hashing (64MB memory, 128-char CPU DoS ceiling).
  - RFC 6819 refresh token rotation with automated token-family invalidation on replay detection.
  - Brute-force account lockout (5 attempts, 15-minute lockout).
  - Google OAuth 2.0 integration with account linking.
  - Account suspension enforcement (`UserStatus: ACTIVE | SUSPENDED`) returning 403 Forbidden.
  - Full test suite verified: **14 test files, 63/63 passing tests**.

### Phase 2: Specialties & Professional Doctor Verification
- **Completed:** 2026-10-26
- **Detailed Report:** See [Phase 2 Specification Document](./phases/phase-02-specialties-verification.md).
- **Key Highlights:**
  - Standardized medical specialties taxonomy seeded in PostgreSQL (`Specialty` entity with unique slugs, icons, active toggles).
  - Live Neon Migration: `20261026110000_add_specialties_and_doctor_credentials` deployed to cloud cluster.
  - Doctor Credential Management: `PATCH /api/v1/professionals/me` with medical license, issuing board, experience, fee, and documents.
  - Credential Swapping Protection: Modifying verified credentials automatically resets status from `APPROVED` to `PENDING`.
  - Email Verification Enforcement: Doctors cannot submit credentials without a verified email address (`requireVerifiedEmail`).
  - Administrative Review Gate: `/api/v1/admin/doctors/pending`, approval gate (requires license), and rejection with audit reasons.
  - Public Discovery: `GET /api/v1/doctors` exposes only verified doctors with filters, search, and pagination.
  - State-of-the-Art Frontend Vertical Slice: Public Directory (`/doctors`), Doctor Profile (`/doctor/profile`), and Admin Review Portal (`/admin/verifications`).
  - Full Test Suite: **18 test files, 86/86 passing tests (100% green)**, 0 build errors in frontend client.

### Phase 3: Doctor Availability & Weekly Slot Management
- **Completed:** 2026-11-04
- **Detailed Report:** See [Phase 3 Specification Document](./phases/phase-03-doctor-availability-scheduling.md).
- **Key Highlights:**
  - Recurring weekly availability schedules (`DoctorAvailability`) supporting per-day working windows (days 0–6) with unique database constraints.
  - Custom date overrides & holiday blackouts (`DoctorScheduleOverride`) with reason tracking and override precedence.
  - Doctor schedule configuration: IANA timezone support, customizable appointment durations (10–120m), and inter-slot buffer times (0–60m).
  - Dynamic mathematical interval expansion (`slot-expansion.service.ts`) computing bookable slots on the fly with zero static database bloat.
  - Timezone determinism: Midday UTC anchoring (`12:00:00Z`) for reliable weekday mapping across all timezones, plus DST convergence.
  - Frontend vertical slice: Doctor Schedule Dashboard (`/doctor/schedule`) and Patient Slot Booking Picker on Doctor Detail (`/doctors/:id`).
  - Full Test Suite: **21 test files, 120/120 passing tests (100% green)**, 4 client test suites / 13 passing tests.

---

## 6. Architectural Hardening & Production Reliability

Post-Phase 3 architectural hardening brought enterprise resilience and operational production readiness across the monorepo:

### Canonical REST API Versioning (`/api/v1`)
- Redundant un-versioned `/api` routes eliminated. All routes are strictly mounted under `/api/v1`.
- Refresh token cookies explicitly scoped to `path: '/api/v1/auth'` preventing cookie leakage on unrelated API endpoints.
- Client services and test suites aligned to canonical `/api/v1` routes.

### Deep Health Checks & Neon Database Probing
- `GET /health` executes a live ping to PostgreSQL (`prisma.$queryRaw'SELECT 1'`).
- Returns HTTP 200 `{ status: 'healthy', database: 'connected', timestamp }` when database is healthy.
- Returns HTTP 503 `{ status: 'unhealthy', database: 'disconnected', error }` if the database is unreachable, enabling cloud load balancers and orchestrators to route traffic safely.

### Centralized Prisma Error Sanitization
- Centralized `error.middleware.ts` intercepts Prisma database exceptions:
  - `P2002` (Unique constraint violation) -> Clean HTTP 409 Conflict with sanitized conflict message.
  - `P2025` (Record not found) -> Clean HTTP 404 Not Found.
  - `P2003` (Foreign key violation) -> Clean HTTP 400 Bad Request.
  - Malformed request bodies (`SyntaxError`) -> Clean HTTP 400 Bad Request (`MALFORMED_JSON`).

### Distributed Request & Correlation Tracking (`x-request-id`)
- `requestIdMiddleware.ts` automatically extracts or generates a UUIDv4 correlation ID via standard `crypto.randomUUID()`.
- Attached to outgoing `x-request-id` response headers.
- Bound to Pino-http logger contexts and included in every standardized error JSON envelope for instant root-cause tracing.

### Zero-Downtime Enterprise Graceful Shutdown
- `server.ts` handles `SIGINT` (Ctrl+C), `SIGTERM` (Kubernetes/container termination), and uncaught exceptions gracefully:
  1. Stops accepting new incoming connections via `server.close()`.
  2. Allows active in-flight requests to complete cleanly.
  3. Safely disconnects Prisma database client (`prisma.$disconnect()`).
  4. Features a 10-second unref'd watchdog timer fail-safe and double-shutdown guard (`isShuttingDown`).

---

## 7. Upcoming Milestone Previews

### Phase 4: Concurrency-Safe Booking & Lifecycle State Machine
- **Objectives:**
  - Appointment booking lifecycle state machine (`PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED | CANCELLED | NO_SHOW`).
  - **Serializable / `SELECT FOR UPDATE` PostgreSQL transactions** ensuring two concurrent patients cannot double-book the same slot.
  - **Redis + BullMQ Queue Infrastructure:**
    - 15-minute delayed expiration queue for unconfirmed slot reservations.
    - Persistent email & notification dispatch queue with exponential backoff retries and outbound rate limiting (migrating from in-memory promises).
    - Redis instant access token invalidation (`user:revoked_before`) collapsing the 15-minute window to 0.0 seconds upon password change or "Logout from All Devices".
  - Interactive booking modal, confirmation screens, and cancellation workflows.

### Phase 5: Payment Strategy, Webhooks & Idempotency
- **Objectives:**
  - Stripe Checkout & Elements integration with pre-authorization holds.
  - Idempotent webhook event ingestion with replay protection.
  - Doctor payout calculations and platform commission ledger.

### Phase 6: Private Medical Document Management with Amazon S3
- **Objectives:**
  - Encrypted Amazon S3 bucket storage with private access policies.
  - Short-lived presigned download URLs with strict ownership validation (IDOR/BOLA protection).
  - Secure patient intake forms and doctor clinical notes upload.

### Phase 7: Real-Time Authenticated In-Appointment Communication
- **Objectives:**
  - Authenticated WebSockets via Socket.IO.
  - Real-time in-consultation chat, message persistence, and typing indicators.
  - WebRTC signaling for peer-to-peer video/audio consultations.

### Phase 8: Constrained AI Triage & Specialist Routing
- **Objectives:**
  - Structured patient intake assistant powered by LLM with strict Zod JSON schema validation.
  - Emergency red-flag detection (chest pain, shortness of breath, acute symptoms) triggering immediate emergency disclaimers.
  - High-dimensional vector matching via `pgvector` recommending relevant clinical specialties.
  - Graceful degradation to manual specialty browsing if AI service times out.

---

## 8. Observability, Logging & Security Policies

- **Logging Standard:** Powered by **Pino**.
  - Requests are logged with method, route, status code, latency, and correlation `reqId`.
  - Errors include structured stack traces and correlation contexts.
  - **Redaction Policy:** All instances of `password`, `newPassword`, `currentPassword`, `token`, `refreshToken`, and sensitive HTTP headers are stripped and replaced with `[REDACTED]`.
- **Credential Hygiene:**
  - Raw passwords and raw refresh tokens are never persisted in plain text.
  - Secrets are managed exclusively via environment variables validated by Zod at startup.
- **Deep Links & Email Configuration:**
  - Email action links (email verification, password resets) use centralized `CLIENT_URL` configuration to prevent host spoofing attacks.

---

## 9. Exporting to PDF or Word

This documentation is written in standard GitHub-Flavored Markdown. To export to a print-ready PDF or Word document:

1. **Using VS Code Extension (Recommended):**
   - Install the extension: **Markdown PDF** (by *yzane*).
   - Open this file (`PROROUTE_MASTER_DOC.md` or any phase document in `docs/phases/`).
   - Right-click anywhere in the editor and choose:
     - `Markdown PDF: Export (pdf)`
     - `Markdown PDF: Export (docx)`
2. **Online / CLI Converters:**
   - Run Pandoc: `pandoc docs/PROROUTE_MASTER_DOC.md -o ProRoute_Specification.pdf`
   - Or push to GitHub; the repository will render this document natively with tables, diagrams, and clickable links.
