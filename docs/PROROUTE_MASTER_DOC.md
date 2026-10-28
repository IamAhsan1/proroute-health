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
6. [Upcoming Milestone Previews](#6-upcoming-milestone-previews)
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

ProRoute follows a 10-phase Full-Stack Vertical Slice milestone execution plan (each phase delivers both core backend APIs and rich frontend user interfaces):

| Phase | Milestone Name | Architecture Scope | Status | Artifact Reference |
|---|---|---|---|---|
| **01** | Architecture Foundation, Core Auth & Security | Backend + Auth UI Slice | **COMPLETED (100% Verified)** | [`docs/phases/phase-01-auth-security.md`](./phases/phase-01-auth-security.md) |
| **02** | Specialties & Professional Doctor Verification | Backend + Directory/Profile/Admin UI | **COMPLETED (100% Verified)** | [`docs/phases/phase-02-specialties-verification.md`](./phases/phase-02-specialties-verification.md) |
| **03** | Doctor Availability & Weekly Slot Management | Backend + Slot Picker Calendar UI | Planned | Roadmap Phase 3 |
| **04** | Concurrency-Safe Booking & Lifecycle State Machine | Backend + Booking Workflow UI | Planned | Roadmap Phase 4 |
| **05** | Payment Strategy, Webhooks & Idempotency | Backend + Checkout & Receipt UI | Planned | Roadmap Phase 5 |
| **06** | Private Medical Document Management with Amazon S3 | Backend + S3 Document Vault UI | Planned | Roadmap Phase 6 |
| **07** | Real-Time Authenticated In-Appointment Communication | Socket.IO + Consultation Chat UI | Planned | Roadmap Phase 7 |
| **08** | Constrained AI Triage & Specialist Routing | Python / Node AI Service + Intake Wizard UI | Planned (Intake Helper) | Roadmap Phase 8 |
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
  - Doctor Credential Management: `PATCH /api/professionals/me` with medical license, issuing board, experience, fee, and documents.
  - Credential Swapping Protection: Modifying verified credentials automatically resets status from `APPROVED` to `PENDING`.
  - Email Verification Enforcement: Doctors cannot submit credentials without a verified email address (`requireVerifiedEmail`).
  - Administrative Review Gate: `/api/admin/doctors/pending`, approval gate (requires license), and rejection with audit reasons.
  - Public Discovery: `GET /api/doctors` exposes only verified doctors with filters, search, and pagination.
  - State-of-the-Art Frontend Vertical Slice (`stitch/` design fidelity): Public Directory (`/doctors`), Doctor Profile (`/doctor/profile`), and Admin Review Portal (`/admin/verifications`).
  - Full Test Suite: **18 test files, 86/86 passing tests (100% green)**, 0 build errors in frontend client.

---

## 6. Upcoming Milestone Previews

### Phase 3: Doctor Availability & Weekly Slot Management
- **Objectives:**
  - Recurring weekly consultation windows and custom date overrides/holiday blocks.
  - Slot expansion service generating bookable appointment slots.
  - Real-time availability calendar UI for doctors and booking slot picker for patients.
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
