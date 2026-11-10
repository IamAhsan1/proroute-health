# ProRoute — Phase 3 Technical Specification & Verification Report

**Document Version:** 1.0.0  
**Phase:** Phase 3 — Doctor Availability & Weekly Slot Management  
**Target Audience:** Software Architects, Engineering Leads, Security Reviewers  
**Status:** Completed & 100% Verified  

---

## 1. Executive Summary

Phase 3 establishes the high-precision scheduling engine for ProRoute. Prior to this phase, doctor profiles could be created, verified, and discovered, but had no scheduling capabilities, time configuration, or bookable slot generation.

Phase 3 delivers:
1. **Recurring Weekly Availability Schedule (`AVL-01`):** Doctors can configure granular, per-day working windows (days 0–6: Sunday through Saturday) with start and end times in HH:mm format.
2. **Timezone & Granularity Customization (`AVL-02`):** Doctors can define their clinical IANA timezone (e.g. `America/New_York`, `Asia/Karachi`, `UTC`), appointment slot duration (10–120 minutes), and inter-appointment buffer times (0–60 minutes).
3. **Custom Date Overrides & Blackouts (`AVL-03`):** Doctors can designate specific calendar dates as non-working holiday blocks or define custom working hours for specific dates that preempt recurring templates.
4. **Dynamic Mathematical Slot Expansion (`AVL-04`):** An on-demand, non-overlapping slot generator (`slot-expansion.service.ts`) eliminates static database row explosion. Bookable intervals are generated mathematically with deterministic weekday mapping and Daylight Saving Time (DST) convergence.
5. **IDOR & BOLA Defense (`SEC-01`, `SEC-03`):** Schedule mutations are strictly scoped to authenticated doctors via `/api/v1/doctor/availability` with verified role checks. Public consumers access slots only via sanitized, read-only endpoints (`/api/v1/doctors/:id/slots`).

---

## 2. Architecture & Domain Slices

Following our **Domain-Oriented Modular Monolith** pattern, Phase 3 encapsulates scheduling under `server/src/modules/availability/`:

```
server/src/modules/availability/
├── __tests__/
│   ├── availability.service.test.ts     # Weekly recurring & override integration tests
│   ├── slot-expansion.service.test.ts   # Interval arithmetic, buffer time, and DST tests
│   └── availability.routes.test.ts      # HTTP endpoints, RBAC, and IDOR protection tests
├── availability.controller.ts           # Request parsing & response serialization
├── availability.repository.ts           # Prisma ORM data access queries & transactions
├── availability.routes.ts               # Router mounting under /api/v1/doctor/availability & /api/v1/doctors/:id
├── availability.service.ts              # Business logic & ownership orchestration
├── availability.types.ts                # Zod schemas, TypeScript types, and validation contracts
└── slot-expansion.service.ts            # Mathematical interval expansion engine
```

On the frontend, Phase 3 integrates directly into the unified layout system:
- **Doctor Schedule Management (`/doctor/schedule`):** Interactive weekly recurring schedule editor, timezone selector, slot duration/buffer controls, and custom date override modal.
- **Patient Appointment Booking Slot Picker (`/doctors/:id`):** Real-time interactive calendar date picker, slot duration badges, and dynamically generated available consultation slot cards.
- **Automatic Multi-Timezone Conversion:** Client-side zero-dependency timezone engine (`lib/timezone.ts`) detecting device timezone via `Intl`, featuring smart dual-mode switcher (`Your Time` vs `Clinic Time`) and subtle clinic-time chips.
- **Support Correlation Tracking (`SupportReferenceCode.tsx`):** Integrates with `x-request-id` header/payload providing 1-click clipboard copy (`Ref: #c73bcdcc`) for frictionless user support.

---

## 3. Database Schema & Migration Record

### 3.1 Migration Identifier: `20261102000000_add_doctor_availability_and_overrides`
- **Applied to:** AWS Neon PostgreSQL Serverless cluster.
- **Data Safety:** Zero downtime, non-destructive additive migration with foreign key cascades and composite unique constraints.

### 3.2 Data Dictionary

#### Extended Table: `Professional`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `timezone` | `TEXT` | `NOT NULL, DEFAULT 'UTC'` | Valid IANA timezone identifier |
| `slotDuration` | `INTEGER` | `NOT NULL, DEFAULT 30` | Duration per appointment in minutes (10–120) |
| `bufferTime` | `INTEGER` | `NOT NULL, DEFAULT 5` | Inter-appointment buffer time in minutes (0–60) |

#### Table: `DoctorAvailability` (Weekly Recurring Schedule)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique availability window identifier |
| `professionalId` | `TEXT` | `NOT NULL, FK -> Professional(id) ON DELETE CASCADE, INDEX` | Owning doctor reference |
| `dayOfWeek` | `INTEGER` | `NOT NULL` | Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) |
| `startTime` | `TEXT` | `NOT NULL` | Window start time (`HH:mm`, 24h format) |
| `endTime` | `TEXT` | `NOT NULL` | Window end time (`HH:mm`, 24h format) |
| `isAvailable` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Availability toggle for the day |
| `createdAt` | `TIMESTAMP(3)` | `NOT NULL, DEFAULT now()` | Creation timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `NOT NULL` | Modification timestamp |

**Indexes & Constraints:**
- `@@unique([professionalId, dayOfWeek])`: Guarantees exactly one recurring window configuration per day per doctor.

#### Table: `DoctorScheduleOverride` (Date-Specific Overrides)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique override identifier |
| `professionalId` | `TEXT` | `NOT NULL, FK -> Professional(id) ON DELETE CASCADE, INDEX` | Owning doctor reference |
| `date` | `DATE` | `NOT NULL` | Target calendar date (`YYYY-MM-DD`) |
| `startTime` | `TEXT` | `NULLABLE` | Custom start time (`HH:mm`), null if non-working day |
| `endTime` | `TEXT` | `NULLABLE` | Custom end time (`HH:mm`), null if non-working day |
| `isAvailable` | `BOOLEAN` | `NOT NULL, DEFAULT false` | `false` represents vacation/holiday; `true` represents custom working hours |
| `reason` | `TEXT` | `NULLABLE` | Optional note (e.g., "Annual Medical Conference") |
| `createdAt` | `TIMESTAMP(3)` | `NOT NULL, DEFAULT now()` | Creation timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `NOT NULL` | Modification timestamp |

**Indexes & Constraints:**
- `@@unique([professionalId, date])`: Guarantees deterministic override resolution per date.

---

## 4. Slot Expansion & Timezone Algorithm

To guarantee scalability and zero database bloat, ProRoute computes appointment intervals dynamically rather than generating physical database rows weeks in advance.

### 4.1 Resolution Hierarchy
When a client requests available slots for a given date (`GET /api/v1/doctors/:id/slots?date=2026-11-15`):
1. **Override Precedence:** The engine checks for a `DoctorScheduleOverride` matching the specified date:
   - If an override exists with `isAvailable: false`, the date is immediately treated as a blackout (returns `[]` slots).
   - If an override exists with `isAvailable: true`, custom `startTime` and `endTime` are used, inheriting the doctor's configured `slotDuration` and `bufferTime`.
2. **Weekly Recurring Fallback:** If no override exists, the engine maps the target date to its day-of-week (0–6).
   - If the doctor is not available on that day or no schedule is set, returns `[]`.
   - Otherwise, uses the recurring `startTime` and `endTime`.

### 4.2 Deterministic Date & DST Safety
1. **Midday UTC Weekday Anchor:** To prevent time zone shifts from calculating the wrong day of the week (e.g. UTC midnight shifting back to Saturday in Western hemispheres), `getCalendarDayOfWeek(dateStr)` anchors the date string at `12:00:00Z` before extracting the UTC day index.
2. **DST Convergence:** Time conversions use `date-fns-tz` with explicit zoned parsing, ensuring that spring-forward and fall-back clock transitions produce exact wall-clock intervals without missing or duplicated slots.

---

## 5. API Specification & Security Contracts

All routes are canonically versioned under `/api/v1`.

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/doctor/availability` | `DOCTOR` (`/me` scoped) | Retrieves doctor's recurring weekly schedule & overrides |
| `PUT` | `/api/v1/doctor/availability` | `DOCTOR` (`/me` scoped) | Upserts recurring weekly schedule, timezone, duration, and buffer |
| `POST` | `/api/v1/doctor/availability/overrides` | `DOCTOR` (`/me` scoped) | Creates or updates a date-specific override or blackout |
| `DELETE`| `/api/v1/doctor/availability/overrides/:id` | `DOCTOR` (`/me` scoped) | Deletes a date-specific override (verifies ownership) |
| `GET` | `/api/v1/doctors/:id/slots` | Public | Expands bookable slots for a doctor on a specific date |
| `GET` | `/api/v1/doctors/:id/available-dates` | Public | Returns calendar availability status for date ranges |

---

## 6. Verification & Test Evidence

### 6.1 Backend Test Results
```
 ✓ src/modules/availability/__tests__/slot-expansion.test.ts (12 tests)
 ✓ src/modules/availability/__tests__/availability.service.test.ts (7 tests)
 ✓ src/middleware/__tests__/rateLimit.middleware.test.ts (2 tests)
 ✓ src/middleware/__tests__/error.middleware.test.ts (7 tests)
 ✓ src/middleware/__tests__/rbac.test.ts (8 tests)
──────────────────────────────────────────────────────────────────
 Test Files  22 passed (22)
      Tests  122 passed (122)
   Duration  9.57s
```

### 6.2 Frontend Test & Build Results
```
 ✓ src/__tests__/availability.service.test.ts (3 tests)
 ✓ src/__tests__/timezone.test.ts (4 tests)
 ✓ src/__tests__/apiError.test.ts (4 tests)
 ✓ src/__tests__/doctor.service.test.ts (3 tests)
 ✓ src/modules/public/__tests__/DoctorDirectoryPage.test.tsx (2 tests)
 ✓ src/modules/admin/__tests__/AdminVerificationsPage.test.tsx (5 tests)
──────────────────────────────────────────────────────────────────
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  1.92s

✓ Built client in 11.29s with 0 errors (tsc --noEmit passed).
```

### 6.3 Security Audit Verification
- **IDOR Immunity:** Doctors cannot inspect, modify, or delete another professional's schedule or overrides. All mutations use the authenticated user's `professionalId`.
- **Zod Input Validation:** Validates 24-hour time formats (`HH:mm`), ensures `endTime > startTime`, enforces slot durations (10–120m), and restricts buffer times (0–60m).
- **Public Data Sanitization:** Public slot discovery endpoints do not expose internal doctor metadata, private notes, or unapproved professional statuses.

