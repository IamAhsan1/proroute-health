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
6. [Upcoming Milestone Previews](#6-upcoming-milestone-previews)
   - [Phase 2: Specialties & Professional Doctor Verification](#phase-2-specialties--professional-doctor-verification)
   - [Phase 3: Constrained AI Triage & pgvector Specialist Routing](#phase-3-constrained-ai-triage--pgvector-specialist-routing)
   - [Phase 4 & 5: Concurrency-Safe Booking & Lifecycle State Machine](#phase-4--5-concurrency-safe-booking--lifecycle-state-machine)
7. [Observability, Logging & Security Policies](#7-observability-logging--security-policies)
8. [Exporting to PDF or Word](#8-exporting-to-pdf-or-word)

---

## 1. Project Overview & Core Value

**ProRoute** is a production-oriented, full-stack healthcare platform engineered to connect patients with verified doctors across medical specialties. 

### Core Value Proposition:
> **Concurrency-safe, IDOR/BOLA-protected healthcare scheduling and consultations with strictly constrained AI triage routing and reliable transactional guarantees.**

Healthcare platforms demand higher standards of engineering than typical consumer apps:
- **Zero Double-Bookings:** Concurrency race conditions during doctor slot bookings must be impossible at the database layer.
- **Strict Privacy & IDOR Immunity:** Medical documents, consultation notes, and private profiles must never be accessible across unauthorized user boundaries.
- **Constrained AI Guardrails:** AI triage must never hallucinate diagnoses or bypass clinical specialties; emergency red-flags (e.g. chest pain) must immediately trigger emergency disclaimers.

---

## 2. Technology Stack

| Layer | Technologies | Justification |
|---|---|---|
| **Backend Core** | Node.js (v20+), Express, TypeScript | High I/O performance, strong static typing, rapid ecosystem integration |
| **Database & ORM** | PostgreSQL 16 (AWS Neon), Prisma ORM (v5.22.0) | Strict ACID compliance, relational integrity, clean type-safe query generation |
| **Vector Search** | PostgreSQL `pgvector` extension | High-dimensional embedding lookups for clinical specialty routing |
| **Asynchronous Queues** | Redis + BullMQ (Phases 4-6) | 15-minute slot reservation expiration, reminder workers, background jobs |
| **Object Storage** | Amazon S3 (Phase 7) | Encrypted private medical document storage accessed via presigned URLs |
| **Realtime** | Socket.IO / WebSockets (Phase 8) | Low-latency in-appointment communication and consultation signaling |
| **Frontend Core** | React 18, Vite, TypeScript | Modern component architecture, fast build cycles, bundle optimization |
| **Client State & Network**| TanStack Query (React Query), Axios Interceptors | Intelligent server caching, background re-fetching, automated silent token refresh |
| **Security & Cryptography**| Argon2id (RFC 9106), JSON Web Tokens (RFC 7519) | State-of-the-art password hashing and dual-token session management |
| **Observability** | Pino Structured Logger | Ultra-low overhead JSON logging with automated credential redaction |

---

## 3. System Architecture & Scalability Blueprint

ProRoute utilizes a **Domain-Oriented Modular Monolith** architecture. All code lives within cohesive business domain modules rather than technical layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│            (React + Vite Web App / Mobile Web)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  ProRoute Express Backend                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security Gateway: Helmet, CORS, Cookie-Parser,        │  │
│  │                   Pino HTTP Logger, IP Rate Limiters  │  │
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
- When traffic scales to 100,000+ daily consultations, any module (e.g. `modules/auth`, `modules/appointments`) can be extracted into an independent microservice behind an API Gateway with zero business logic rewrites.

---

## 4. Phased Engineering Roadmap

ProRoute follows a 10-phase milestone execution plan:

| Phase | Milestone Name | Status | Artifact Reference |
|---|---|---|---|
| **01** | Architecture Foundation, Core Auth & Security | **COMPLETED (100% Verified)** | [`docs/phases/phase-01-auth-security.md`](./phases/phase-01-auth-security.md) |
| **02** | Specialties & Professional Doctor Verification | **READY FOR EXECUTION** | Upcoming (`docs/phases/phase-02-*.md`) |
| **03** | Constrained AI Triage & pgvector Specialist Routing | Planned | Roadmap Phase 3 |
| **04** | Doctor Availability & Weekly Slot Management | Planned | Roadmap Phase 4 |
| **05** | Concurrency-Safe Booking & Lifecycle State Machine | Planned | Roadmap Phase 5 |
| **06** | Payment Strategy, Webhooks & Idempotency | Planned | Roadmap Phase 6 |
| **07** | Private Medical Document Management with Amazon S3 | Planned | Roadmap Phase 7 |
| **08** | Real-Time Authenticated In-Appointment Communication | Planned | Roadmap Phase 8 |
| **09** | Patient, Doctor & Admin User Interfaces | Planned | Roadmap Phase 9 |
| **10** | Security Hardening, Automated E2E Testing & Observability | Planned | Roadmap Phase 10 |

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
  - Baseline migration `20261022145500_init_auth_schema` recorded in live Neon PostgreSQL database.
  - Monetary precision hardened to `DECIMAL(10,2)`.
  - Token lookups indexed with `@unique` B-tree indexes.
  - Profile update query count optimized from 3 round-trips to a single atomic update.
  - Full test suite verified: **14 test files, 63/63 passing tests**.

---

## 6. Upcoming Milestone Previews

### Phase 2: Specialties & Professional Doctor Verification
- **Objectives:**
  - Build clinical taxonomy tables: `Specialty` (Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, General Medicine, ENT).
  - Doctor verification workflow: License number, issuing medical board, credential attachments.
  - Administrative review portal with state machine: `PENDING -> APPROVED | REJECTED`.
  - Public directory API listing verified doctors with search and specialty filters.

### Phase 3: Constrained AI Triage & pgvector Specialist Routing
- **Objectives:**
  - Patient intake chat interface for symptom description.
  - Emergency red-flag detection (e.g. chest pain, severe dyspnea) forcing immediate ER disclaimers.
  - PostgreSQL `pgvector` embeddings matching clinical symptoms to appropriate medical specialties.
  - Strictly constrained JSON schema with Zod validation. Fallback to manual selection if AI times out.

### Phase 4 & 5: Concurrency-Safe Booking & Lifecycle State Machine
- **Objectives:**
  - Doctor weekly recurring availability schedules and custom date overrides.
  - **Serializable / `SELECT FOR UPDATE` PostgreSQL transactions** ensuring two concurrent patients cannot double-book the same slot.
  - BullMQ 15-minute delayed expiration queue for unconfirmed reservations.

---

## 7. Observability, Logging & Security Policies

- **Logging Standard:** Powered by **Pino**.
  - Requests are logged with method, route, status code, and latency.
  - Errors include structured stack traces and correlation contexts.
  - **Redaction Policy:** All instances of `password`, `newPassword`, `currentPassword`, `token`, `refreshToken`, and sensitive HTTP headers are stripped and replaced with `[REDACTED]`.
- **Credential Hygiene:**
  - Raw passwords and raw refresh tokens are never persisted in plain text.
  - Secrets are managed exclusively via environment variables validated by Zod at startup.

---

## 8. Exporting to PDF or Word

This documentation is written in standard GitHub-Flavored Markdown. To export to a print-ready PDF or Word document:

1. **Using VS Code Extension (Recommended):**
   - Install the extension: **Markdown PDF** (by *yzane*).
   - Open this file (`PROROUTE_MASTER_DOC.md` or `phase-01-auth-security.md`).
   - Right-click anywhere in the editor and choose:
     - `Markdown PDF: Export (pdf)`
     - `Markdown PDF: Export (docx)`
2. **Online / CLI Converters:**
   - Run Pandoc: `pandoc docs/PROROUTE_MASTER_DOC.md -o ProRoute_Specification.pdf`
   - Or push to GitHub; the repository will render this document natively with tables, diagrams, and clickable links.
