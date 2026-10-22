# ProRoute — Phase 1 Technical Specification & Verification Report

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Architecture Foundation, Authentication & Security Hardening  
**Target Audience:** Software Architects, Engineering Leads, Security Auditors  
**Status:** Completed & 100% Verified  

---

## 1. Executive Summary

ProRoute is a production-oriented, full-stack healthcare appointment platform connecting patients with verified medical professionals. The core engineering mandate of Phase 1 is to establish a concurrency-safe, IDOR/BOLA-protected foundation featuring:
- A Domain-Oriented Modular Monolith backend (Node.js, Express, TypeScript, Prisma ORM, PostgreSQL).
- Enterprise-grade cryptographic authentication with Argon2id password hashing, RFC 6819 refresh token rotation, and Google OAuth 2.0.
- PostgreSQL schema baseline with zero floating-point monetary imprecision (`Decimal(10, 2)`), B-tree unique token indexing, and `UserStatus` account controls.
- A centralized React + TanStack Query frontend enclave with automatic Axios interceptor token refresh.

---

## 2. Architecture & Design Patterns

### 2.1 Backend Architecture: Domain-Oriented Modular Monolith
Rather than grouping files arbitrarily by layer (e.g. dumping all controllers in one folder), the backend organizes logic into cohesive domain modules under `server/src/modules/`:

```
server/src/
├── config/              # Centralized environment validation (Zod)
├── lib/                 # Shared singletons (Prisma client, Pino structured logger)
├── middleware/          # Cross-cutting concerns (Auth, RBAC, Rate-Limiting, Error Handling)
├── modules/
│   ├── auth/            # Authentication, JWT, Argon2id, Google OAuth, Recovery
│   │   ├── __tests__/   # 9 dedicated unit & integration test suites
│   │   ├── auth.controller.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.types.ts
│   │   ├── argon2.service.ts
│   │   └── jwt.service.ts
│   └── users/           # User profile & IDOR-safe `/me` boundary
│       ├── __tests__/
│       ├── user.controller.ts
│       ├── user.repository.ts
│       ├── user.routes.ts
│       ├── user.service.ts
│       └── user.types.ts
├── services/            # Infrastructure adapters (Nodemailer, Resend)
├── app.ts               # Express application pipeline
└── server.ts            # HTTP listener & graceful shutdown handlers
```

#### Layer Responsibilities:
- **Routes Layer (`*.routes.ts`):** Defines HTTP verbs, attaches rate limiters, and binds authentication/RBAC middleware.
- **Controller Layer (`*.controller.ts`):** Validates incoming requests against Zod schemas, extracts cookie/header tokens, delegates to services, and shapes HTTP responses.
- **Service Layer (`*.service.ts`):** Pure business logic, token orchestration, authorization checks, and transaction coordination. Completely agnostic of Express `req`/`res`.
- **Repository Layer (`*.repository.ts`):** Pure data access through Prisma ORM. Encapsulates all SQL transactions, unique queries, and batch operations.

### 2.2 Frontend Architecture: Reactive Client Enclave
The frontend application is engineered with **React 18, Vite, and TypeScript** located in `client/src/`:

```
client/src/
├── api/
│   ├── axios.ts         # Centralized Axios instance with silent 401 refresh interceptors
│   ├── client.ts        # Type-safe API client methods for Auth & Users
│   └── types.ts         # Shared frontend DTO interfaces
├── components/
│   ├── AuthEnclave.tsx  # Unified authentication modal (Login, Register, Password Recovery)
│   └── AuthStatus.tsx   # Authenticated session banner, role indicator & verification alert
├── App.tsx              # Root shell with TanStack Query provider
└── main.tsx             # React DOM bootstrap
```

#### Client Architectural Pillars:
1. **Silent Automated Token Refresh (Axios Interceptors):**
   - When any protected API request encounters an expired 15-minute access token (`HTTP 401 Unauthorized`), the Axios response interceptor intercepts the failure before it bubbles up to UI components.
   - It transparently dispatches a `POST /api/auth/refresh` request using HttpOnly cookies.
   - Upon receiving fresh credentials, it replays the original failed request seamlessly, ensuring the user experience is never interrupted by session timeouts.
2. **Server State Management (TanStack Query):**
   - Manages asynchronous user profiles, mutations, and cache invalidation.
   - Profile queries (`useQuery(['me'])`) automatically sync across all open tabs.
3. **Form Validation & UX (React Hook Form + Zod):**
   - Forms validate passwords, email formatting, and required fields before sending network packets, providing instant visual feedback.
   - Dual-role registration tabs allow users to switch seamlessly between Patient and Doctor sign-up modes.

---

## 3. Security & Cryptographic Architecture

### 3.1 Password Hashing: Argon2id (RFC 9106)
Passwords are never stored in plaintext. They are processed using Argon2id (hybrid data-dependent/independent memory-hard function resistant to GPU cracking and side-channel attacks):

| Parameter | Configured Value | Security Rationale |
|---|---|---|
| **Type** | Argon2id (`argon2.argon2id`) | Hybrid protection against time-memory trade-off & cache-timing attacks |
| **Memory Cost** | 64 MB (`65536 KB`) | Exceeds OWASP minimum (19 MB) for high offline cracking resistance |
| **Time Cost** | 3 iterations | Balanced computation time (~300-500ms on modern CPU) |
| **Parallelism** | 4 threads | Leverages multi-core server hardware |
| **Input Upper Bound** | Max 128 characters | **Argon2 CPU DoS Protection:** Prevents attackers from submitting multi-megabyte payloads to lock server CPU threads |

### 3.2 Token Architecture & RFC 6819 Rotation
ProRoute implements dual-token stateless session management:

```
[ Client ] ──( 1. Valid Refresh Request )──> [ /api/auth/refresh ]
    ▲                                               │
    │                                     ( Revoke Token 1 )
    │                                     ( Issue Token 2 Pair )
    └─── New Access Token + New Refresh ────────────┘

[ Attacker ] ──( 2. Replay Token 1 )───────> [ /api/auth/refresh ]
                                                    │
                                         ( Token 1 is Revoked! )
                                         ( REPLAY ATTACK DETECTED )
                                         ( Revoke ALL User Sessions )
                                         ( Return 401 Unauthorized )
```

1. **Access Token:**
   - **Lifespan:** 15 minutes (`JWT_ACCESS_EXPIRES_IN=15m`).
   - **Claims:** `{ id, email, role, status, isEmailVerified }`.
   - **Storage:** Dual transport (Authorization Bearer Header or `access_token` HttpOnly Cookie).
2. **Refresh Token:**
   - **Lifespan:** 7 days (`JWT_REFRESH_EXPIRES_IN=7d`).
   - **Storage in DB:** Stored strictly as a SHA-256 cryptographic hash (`tokenHash`). Raw refresh tokens are never persisted in the database.
   - **Strict Rotation:** Every refresh request invalidates the consumed refresh token and issues a new pair.
   - **Reuse Detection (RFC 6819 Section 5.2.2.3):** If a previously revoked token is submitted, the system flags a session hijack, terminates the entire token family, and revokes all active sessions for that user.

### 3.3 Account Lockout & Brute-Force Defenses
To prevent credential stuffing and brute-force attacks:
- **Threshold:** 5 consecutive failed login attempts.
- **Lockout Duration:** 15-minute temporary lockout (`lockUntil = Date.now() + 15m`).
- **User Enumeration Defense:** Password recovery (`/api/auth/forgot-password`) and login endpoints return generic response messages (`"If an account exists, instructions have been sent"`) to prevent attackers from discovering valid registered emails.

### 3.4 IDOR / BOLA Prevention
Resource ownership is verified strictly at the server boundary:
- Private patient/doctor profiles are exposed exclusively via `/api/users/me`.
- Identity is derived strictly from the validated cryptographic JWT context (`req.user.id`).
- Clients cannot supply arbitrary user IDs in query parameters or request bodies to access or mutate other users' records.

---

## 4. PostgreSQL Database Schema & Normalization

The database runs on AWS Neon PostgreSQL (PostgreSQL 16) with Prisma ORM (v5.22.0).

### 4.1 Data Dictionary

#### Table: `User`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique user identifier |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | Normalized lowercase email |
| `passwordHash` | `TEXT` | `NULLABLE` | Argon2id hash (null for OAuth-only users) |
| `googleId` | `TEXT` | `NULLABLE, UNIQUE` | Google OAuth subject identifier |
| `role` | `Role` (Enum) | `NOT NULL, DEFAULT 'PATIENT'` | `PATIENT`, `DOCTOR`, `ADMIN`, `SUPER_ADMIN` |
| `status` | `UserStatus` (Enum) | `NOT NULL, DEFAULT 'ACTIVE'` | `ACTIVE`, `SUSPENDED` |
| `isEmailVerified`| `BOOLEAN` | `NOT NULL, DEFAULT false` | Email verification flag |
| `emailVerificationToken` | `TEXT` | `NULLABLE, UNIQUE` | SHA-256 hashed verification token |
| `emailVerificationExpires` | `TIMESTAMP(3)`| `NULLABLE` | Verification token expiry |
| `passwordResetToken` | `TEXT` | `NULLABLE, UNIQUE` | SHA-256 hashed password reset token |
| `passwordResetExpires` | `TIMESTAMP(3)`| `NULLABLE` | Password reset token expiry |
| `failedLoginAttempts` | `INTEGER` | `NOT NULL, DEFAULT 0` | Counter for account lockout |
| `lockUntil` | `TIMESTAMP(3)`| `NULLABLE` | Expiry timestamp for temporary lockout |
| `createdAt` | `TIMESTAMP(3)`| `NOT NULL, DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `TIMESTAMP(3)`| `NOT NULL` | Record modification timestamp |

#### Table: `Patient`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique patient record identifier |
| `userId` | `TEXT` | `NOT NULL, UNIQUE, FK -> User(id)` | Cascading 1-to-1 relationship |
| `name` | `TEXT` | `NOT NULL` | Patient full name |
| `phone` | `TEXT` | `NULLABLE` | Contact phone number |

#### Table: `Professional`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique professional identifier |
| `userId` | `TEXT` | `NOT NULL, UNIQUE, FK -> User(id)` | Cascading 1-to-1 relationship |
| `profession` | `TEXT` | `NOT NULL, DEFAULT 'DOCTOR'` | Profession category |
| `specialtyId` | `TEXT` | `NULLABLE` | Foreign key to Specialty (Phase 2) |
| `verificationStatus` | `VerificationStatus` | `NOT NULL, DEFAULT 'PENDING'` | `PENDING`, `APPROVED`, `REJECTED` |
| `consultationFee` | `DECIMAL(10,2)` | `NULLABLE` | Arbitrary-precision monetary consultation fee |
| `bio` | `TEXT` | `NULLABLE` | Professional biography |

#### Table: `RefreshToken`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique session identifier |
| `tokenHash` | `TEXT` | `NOT NULL, UNIQUE` | SHA-256 hash of refresh token |
| `userId` | `TEXT` | `NOT NULL, FK -> User(id)` | Cascading foreign key |
| `expiresAt` | `TIMESTAMP(3)`| `NOT NULL` | Token expiration timestamp |
| `revoked` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Revocation status flag |

### 4.2 Indexing & Optimization Strategy
1. **O(1) Token Lookups:** Making `emailVerificationToken` and `passwordResetToken` `@unique` created B-tree indexes, eliminating table scans during verification/recovery.
2. **Redundant Index Removal:** Removed `@@index([email])` because `email String @unique` already provisions an index.
3. **Foreign Key Index:** `RefreshToken_userId_idx` optimizes cascade deletions and session lookups.
4. **Monetary Accuracy:** `consultationFee` was migrated from IEEE-754 `Float?` to `Decimal(10, 2)` to eliminate floating-point rounding errors.

---

## 5. API Reference Catalog

All endpoints return uniform response payloads:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### 5.1 Authentication Routes (`/api/auth`)
| Method | Endpoint | Protection | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | 5 req / 15m | Register Patient or Doctor account |
| `POST` | `/api/auth/login` | Public | 5 req / 15m | Authenticate with credentials |
| `POST` | `/api/auth/google` | Public | 5 req / 15m | Google OAuth 2.0 exchange & account linking |
| `POST` | `/api/auth/refresh` | Cookie / Header | - | Rotate refresh token and issue fresh token pair |
| `POST` | `/api/auth/logout` | Cookie / Header | - | Revoke refresh token and clear HttpOnly cookies |
| `POST` | `/api/auth/forgot-password` | Public | 5 req / 15m | Request password recovery email |
| `POST` | `/api/auth/reset-password` | Public | 5 req / 15m | Submit new password with secure reset token |
| `GET` | `/api/auth/verify-email` | Public | - | Verify email via URL token (redirects to client) |
| `POST` | `/api/auth/verify-email` | Public | - | Verify email via JSON body |
| `POST` | `/api/auth/resend-verification` | Public | 2 req / 5m | Resend email verification link |
| `POST` | `/api/auth/change-password` | JWT Authenticated | - | Change password and revoke all active sessions |

### 5.2 User Routes (`/api/users`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | JWT Authenticated | Retrieve authenticated user profile |
| `PATCH` | `/api/users/me` | JWT Authenticated | Update authenticated user profile (atomic single query) |

---

## 6. Verification & Test Evidence

### 6.1 Test Suite Breakdown (100% Passing)
Executed via `vitest run` on Node.js v20+:

```
 Test Files  14 passed (14)
      Tests  63 passed (63)
   Duration  ~12s
```

1. **`argon2.service.test.ts` (3 tests):** Hashes with argon2id signature, verifies matching password, rejects mismatches.
2. **`email.service.test.ts` (4 tests):** Generates 6-digit verification codes, sends emails via Nodemailer with correct templates.
3. **`lockout.test.ts` (3 tests):** Locks user out after 5 consecutive failed attempts, resets counter on success, allows login after lockout expiry.
4. **`login.test.ts` (5 tests):** Validates credentials, sets HttpOnly cookies, rejects bad passwords with generic 401, rejects passwords > 128 chars, **rejects suspended accounts with 403 Forbidden**.
5. **`logout.test.ts` (4 tests):** Rotates refresh tokens, invalidates token family on reuse replay detection (RFC 6819), clears cookies, **rejects concurrent refresh token race conditions**.
6. **`password-recovery.test.ts` (6 tests):** Enumeration-safe forgot-password, resets password in transaction, revokes active sessions, **handles concurrent reset submissions atomically**.
7. **`register.test.ts` (7 tests):** Creates user + profile atomically, rejects duplicates (409), enforces password strength, rejects passwords > 128 chars, **rejects privileged roles (ADMIN/SUPER_ADMIN)**, **rolls back on transaction failure**.
8. **`change-password.test.ts` (4 tests):** Rejects unauthenticated requests, verifies current password, enforces new password strength, revokes all user sessions.
9. **`email-verification.test.ts` (8 tests):** Validates token hashes and expiry, updates `isEmailVerified`, handles redirection to client UI.
10. **`google-auth.test.ts` (5 tests):** Registers new user, logs in existing user, links Google ID to existing email account, validates ID token signatures.
11. **`rbac.test.ts` (8 tests):** Rejects missing/invalid tokens, enforces doctor-only role gates, accepts both headers and cookies, **rejects suspended user access tokens (403)**, **enforces `requireVerifiedEmail` middleware**.
12. **`me.test.ts` (4 tests):** Proves IDOR protection across User A and User B, verifies `/me` isolation.
13. **`retention.test.ts` (1 test):** Validates `purgeExpiredRefreshTokens()` filter logic.
14. **`health.test.ts` (1 test):** Verifies uptime, timestamp, and service status.

---

## 7. Logging & Observability

The backend incorporates **Pino** (high-performance structured JSON logging):
- **Development:** Colorized output via `pino-pretty` with timestamp and request timings.
- **Production:** High-throughput JSON logs formatted for aggregators (Datadog, AWS CloudWatch, Logstash).
- **Security Redaction:** Sensitive keys (`password`, `newPassword`, `currentPassword`, `token`, `refreshToken`, `authorization`, `cookie`) are censored to `[REDACTED]`.
- **HTTP Middleware:** Integrated via `pino-http` in `server/src/app.ts` for automated status code logging.
