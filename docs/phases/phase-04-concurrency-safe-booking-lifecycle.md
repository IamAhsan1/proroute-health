# ProRoute — Phase 4 Technical Specification & Verification Report

**Document Version:** 1.0.0  
**Phase:** Phase 4 — Concurrency-Safe Booking Lifecycle  
**Target Audience:** Software Architects, Engineering Leads, Security Reviewers  
**Status:** Completed & 100% Verified  

---

## 1. Executive Summary

Phase 4 delivers the transactional core of the ProRoute healthcare appointment engine. In high-demand telemedicine platforms, multiple patients frequently attempt to reserve the same doctor appointment slot simultaneously. Without strict transactional guarantees and race-condition defenses, double-booking occurs, leading to clinical chaos, patient frustration, and provider scheduling conflicts.

Phase 4 delivers:
1. **Two-Tier Concurrency Control & Race Defense (`SEC-04`):** Row-level serialization locking in PostgreSQL (`SELECT ... FOR UPDATE`) paired with an immutable PostgreSQL partial unique index (`Appointment_active_slot_unique_idx`) prevents double-booking under extreme parallel contention.
2. **Deterministic Lifecycle State Machine (`APT-01`):** Explicit transition matrix governing states: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `EXPIRED`, and `NO_SHOW`.
3. **Anti-Hoarding & Overlap Protection (`APT-02`):** Per-patient active hold ceiling (max 2 pending holds) and active patient time conflict validation (`PATIENT_TIME_CONFLICT`).
4. **Asynchronous 15-Minute Expiration Worker (`APT-03`):** Delayed BullMQ jobs backed by Redis idempotently expire unpaid reservation holds, immediately restoring slot availability to the public directory.
5. **Instant Access Token Revocation (`SEC-02`):** Global logout and password changes immediately invalidate active JWT access tokens via Redis-backed `user:revoked_before` timestamp comparisons.
6. **Policy-Enforced Cancellation (`APT-04`):** 2-hour advance cancellation window for confirmed consultations, plus mandatory clinical reason requirements for doctor cancellations.
7. **Frontend Consultation Portals:** Interactive `BookingConfirmModal` with 409 conflict auto-recovery, Patient Consultation Dashboard (`/portal/appointments`), and Doctor Consultation Queue (`/doctor/appointments`).

---

## 2. Architecture & Domain Slices

Phase 4 encapsulates booking and queue management under `server/src/modules/appointments/`, queues in `server/src/queues/`, and workers in `server/src/workers/`:

```
server/src/modules/appointments/
├── __tests__/
│   ├── appointment.booking.test.ts          # Concurrency parallel race tests (5-request test)
│   ├── appointment.idor.test.ts             # IDOR/BOLA authorization and ownership tests
│   └── appointment.state-machine.test.ts    # State transition & cancellation window tests
├── appointment.controller.ts                # Express route controllers & status mappers
├── appointment.queue-hooks.ts               # BullMQ job scheduler & cancellation hooks
├── appointment.repository.ts                # SELECT FOR UPDATE transaction & Prisma queries
├── appointment.routes.ts                    # REST endpoints mounted at /api/v1/appointments
├── appointment.service.ts                   # Domain rules, validation & ownership enforcement
└── appointment.types.ts                     # Zod input schemas & API response contracts

server/src/queues/
├── appointment.queue.ts                     # BullMQ delayed expiration queue
└── email.queue.ts                           # BullMQ transactional email queue

server/src/workers/
├── __tests__/
│   └── appointment-expiration.worker.test.ts # Expiration idempotency & transition tests
├── appointment-expiration.worker.ts         # Hold expiration background worker
└── email.worker.ts                          # Transactional email dispatch worker
```

On the frontend, Phase 4 delivers:
- **`BookingConfirmModal.tsx`:** Modal with live dual-timezone display, fee conversion, 15-minute hold timer, and 409 auto-invalidation to refresh slots when another patient claims the slot first.
- **`PatientAppointmentsPage.tsx` (`/portal/appointments`):** Filterable patient consultation list (Upcoming, Past, Cancelled) with direct cancel modal triggering and status badges.
- **`DoctorAppointmentsPage.tsx` (`/doctor/appointments`):** Interactive queue for practitioners to start consultations (`IN_PROGRESS`), mark complete (`COMPLETED`), or mark no-show (`NO_SHOW`).
- **`CancelAppointmentModal.tsx`:** Modal enforcing the 2-hour cancellation notice policy for patients and requiring mandatory clinical justification for doctors.

---

## 3. Database Schema & Migration Record

### 3.1 Migration: `20261112120000_add_appointments_and_state_history`
- **Applied to:** AWS Neon PostgreSQL Serverless cluster.
- **Data Safety:** Non-destructive additive migration creating `Appointment`, `AppointmentStatusHistory`, and the partial unique index.

### 3.2 Data Models

#### `Appointment` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique appointment identifier |
| `patientId` | `UUID` | `FK -> Patient(id), ON DELETE CASCADE` | Assigned patient profile |
| `professionalId` | `UUID` | `FK -> Professional(id), ON DELETE CASCADE` | Assigned doctor profile |
| `startTimeUtc` | `TIMESTAMPTZ` | `NOT NULL` | Appointment start time in UTC |
| `endTimeUtc` | `TIMESTAMPTZ` | `NOT NULL` | Appointment end time in UTC |
| `status` | `AppointmentStatus` | `NOT NULL, DEFAULT 'PENDING'` | Current lifecycle status |
| `consultationFee` | `DECIMAL(10,2)` | `NULLABLE` | Consultation fee snapshot at booking |
| `notes` | `TEXT` | `NULLABLE` | Optional patient intake notes |
| `cancellationReason` | `TEXT` | `NULLABLE` | Reason provided upon cancellation |
| `cancelledByRole` | `Role` | `NULLABLE` | Role of user that cancelled appointment |
| `cancelledAt` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp of cancellation |
| `expiresAt` | `TIMESTAMPTZ` | `NULLABLE` | Hold expiration time (15m from creation) |
| `confirmedAt` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when hold was confirmed |
| `startedAt` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when doctor started session |
| `completedAt` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when consultation finished |
| `createdAt` | `TIMESTAMPTZ` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `UPDATED AT` | Record last modification timestamp |

#### `AppointmentStatusHistory` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | History record identifier |
| `appointmentId` | `UUID` | `FK -> Appointment(id), ON DELETE CASCADE` | Parent appointment reference |
| `fromStatus` | `AppointmentStatus` | `NULLABLE` | Originating status |
| `toStatus` | `AppointmentStatus` | `NOT NULL` | Target status |
| `changedBy` | `UUID` | `NULLABLE` | User ID who initiated the transition |
| `reason` | `TEXT` | `NULLABLE` | Justification or automated transition reason |
| `createdAt` | `TIMESTAMPTZ` | `DEFAULT now()` | Timestamp of state transition |

#### Immutable Database Partial Unique Index:
```sql
CREATE UNIQUE INDEX "Appointment_active_slot_unique_idx"
ON "Appointment"("professionalId", "startTimeUtc")
WHERE status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS');
```

---

## 4. Concurrency Control & Serialization Architecture

### 4.1 Two-Tier Race Defense
1. **Application-Level Row Lock:** Inside `appointment.repository.ts`, `prisma.$transaction` locks the doctor row using:
   ```sql
   SELECT id, "verificationStatus", "consultationFee", timezone
   FROM "Professional"
   WHERE id = ${params.professionalId}
   FOR UPDATE
   ```
2. **Database Invariant:** If concurrent transactions race past the lock before it is acquired, the PostgreSQL partial unique index ensures that the second insertion throws `P2002` (Unique constraint violation), safely transformed into:
   ```json
   {
     "success": false,
     "error": "This time slot is already reserved or booked",
     "code": "SLOT_ALREADY_BOOKED"
   }
   ```

### 4.2 Concurrency Verification Test
In `appointment.booking.test.ts`:
- 5 concurrent HTTP requests are sent simultaneously for the exact same doctor and slot.
- Result: **1 request receives HTTP 201 Created**, while **4 competing requests receive HTTP 409 Conflict with `SLOT_ALREADY_BOOKED`**.

---

## 5. Asynchronous Workers & Hold Expiration

- **Queue Engine:** BullMQ on top of Redis (`ioredis`).
- **Delayed Jobs:** When an appointment with a fee is reserved, a delayed job is scheduled for 15 minutes (`PENDING_HOLD_DURATION_MS = 900,000`).
- **Worker Execution:** `appointment-expiration.worker.ts` executes `processExpirationJob(appointmentId)`.
- **Idempotency Guarantee:** If the appointment was paid/confirmed or cancelled before the timer fires, the worker detects `status !== 'PENDING'` and safely exits with zero changes.
- **In-Memory Fallback:** When `REDIS_URL` is omitted in development environments, an in-memory timer fallback provides continuous background expiration without requiring external daemons.

---

## 6. REST API Endpoints

All endpoints are canonically mounted under `/api/v1/appointments`:

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/appointments` | Authenticated Patient, Verified Email, Rate Limited | Reserve an appointment slot (auto-confirms if free, holds 15m if fee > 0) |
| `GET` | `/api/v1/appointments/me` | Authenticated User | List appointments scoped to caller's role (patient consultations or doctor queue) |
| `GET` | `/api/v1/appointments/:id` | Authenticated Participant or Admin | Get detailed appointment record with status history and participant info |
| `PATCH` | `/api/v1/appointments/:id/cancel` | Authenticated Participant | Cancel appointment (enforcing 2-hour window for patients; mandatory reason for doctors) |
| `PATCH` | `/api/v1/appointments/:id/confirm` | Authenticated Participant | Pre-Phase 5 confirmation bridge for pending appointments with consultation fee |
| `PATCH` | `/api/v1/appointments/:id/status` | Authenticated Doctor | Transition consultation status (`IN_PROGRESS`, `COMPLETED`, `NO_SHOW`) |

---

## 7. Quality Gates & Test Verification

| Gate | Target | Result | Status |
| :--- | :--- | :---: | :---: |
| **Backend TypeScript Build** | `npm run --workspace=server build` | 0 errors | **PASS** |
| **Frontend TypeScript Build** | `npm run --workspace=client build` | 0 errors | **PASS** |
| **Concurrency Control (SEC-04)** | 5 concurrent parallel requests | 1 win (201), 4 losers (409) | **PASS** |
| **Lifecycle State Machine** | `appointment.state-machine.test.ts` (8 tests) | 8/8 passed | **PASS** |
| **IDOR & BOLA Defenses** | `appointment.idor.test.ts` (7 tests) | 7/7 passed | **PASS** |
| **Hold Expiration Worker** | `appointment-expiration.worker.test.ts` (4 tests) | 4/4 passed | **PASS** |
| **Instant Access Token Revocation** | `instant-revocation.test.ts` (3 tests) | 3/3 passed | **PASS** |
| **Frontend Booking Modal** | `BookingConfirmModal.test.tsx` (4 tests) | 4/4 passed | **PASS** |
| **Frontend Appointment Service** | `appointment.service.test.ts` (6 tests) | 6/6 passed | **PASS** |
| **System-wide Vitest Suite** | `npm run test:server` & `npm run test:client` | 186/186 passed | **PASS** |

---

## 8. Conclusion
Phase 4 provides ProRoute with a battle-tested, concurrency-safe booking engine that guarantees clinical scheduling integrity, prevents patient double-booking, and secures private medical consultations against IDOR vulnerabilities.
