# ProRoute — Phase 2 Technical Specification & Verification Report

**Document Version:** 1.0.0  
**Phase:** Phase 2 — Specialties & Professional Doctor Verification  
**Target Audience:** Software Architects, Engineering Leads, Security Reviewers  
**Status:** Completed & 100% Verified  

---

## 1. Executive Summary

Phase 2 establishes the medical taxonomy and clinical credential verification lifecycle for ProRoute. Prior to this phase, doctor profiles were generic stubs without specialties, verification controls, or license tracking. 

Phase 2 delivers:
1. **Clinical Specialty Taxonomy (`PROF-05`):** Standardized medical specialties database with seeded taxonomies, slug indexing, and public discovery endpoints.
2. **Doctor Credential Submission (`PROF-01`):** Doctors can submit verified license numbers, issuing medical councils, years of experience, and credential document links.
3. **Mandatory Email Verification Enforcement:** Resolving the Phase 1 audit finding, doctor credential submissions strictly require a verified email address via `requireVerifiedEmail`.
4. **Administrative Verification Lifecycle (`PROF-02`):** Secure review workflows (`PENDING -> APPROVED | REJECTED`) accessible exclusively to `ADMIN` and `SUPER_ADMIN` roles with rejection reason tracking.
5. **Approved-Only Public Discovery (`PROF-03`, `PROF-04`):** Public search directory returning strictly verified (`APPROVED`) doctors, with multi-parameter filtering (specialty slug, name search, consultation fee range).

---

## 2. Architecture & Domain Slices

Following our **Domain-Oriented Modular Monolith** pattern, Phase 2 introduces two cohesive modules in `server/src/modules/`:

```
server/src/modules/
├── specialties/                 # Clinical taxonomy domain slice
│   ├── __tests__/               # 5 dedicated unit & integration tests
│   ├── specialty.controller.ts
│   ├── specialty.repository.ts
│   ├── specialty.routes.ts
│   ├── specialty.service.ts
│   └── specialty.types.ts
└── professionals/              # Doctor profiles, verification & directory
    ├── __tests__/               # 18 integration tests across 3 suites
    ├── admin.routes.ts          # /api/admin/doctors/* (Protected RBAC)
    ├── doctor.routes.ts         # /api/doctors (Public discovery)
    ├── professional.controller.ts
    ├── professional.repository.ts
    ├── professional.routes.ts   # /api/professionals/me (Doctor private)
    ├── professional.service.ts
    └── professional.types.ts
```

---

## 3. Database Schema & Migration Record

### 3.1 Migration Identifier: `20261026110000_add_specialties_and_doctor_credentials`
- **Applied to:** AWS Neon PostgreSQL (`ep-silent-rice-b4g3qh38.c-6.us-east-2.aws.neon.tech`).
- **Data Safety:** Fully additive and non-destructive. All existing records preserved intact.

### 3.2 Data Dictionary

#### Table: `Specialty`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` (UUIDv4) | Unique specialty identifier |
| `name` | `TEXT` | `NOT NULL, UNIQUE` | Clinical specialty name (e.g. Cardiology) |
| `slug` | `TEXT` | `NOT NULL, UNIQUE, INDEX` | URL-friendly slug (e.g. `cardiology`) |
| `description`| `TEXT` | `NULLABLE` | Clinical scope and description |
| `icon` | `TEXT` | `NULLABLE` | Icon identifier for UI rendering |
| `isActive` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Active availability flag |
| `createdAt` | `TIMESTAMP(3)`| `NOT NULL, DEFAULT now()` | Creation timestamp |
| `updatedAt` | `TIMESTAMP(3)`| `NOT NULL` | Modification timestamp |

#### Extended Table: `Professional`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `specialtyId` | `TEXT` | `NULLABLE, FK -> Specialty(id), INDEX` | Primary specialty reference (`ON DELETE SET NULL`) |
| `licenseNumber`| `TEXT` | `NULLABLE, UNIQUE` | Medical license number (prevents duplicate credentials) |
| `medicalBoard` | `TEXT` | `NULLABLE` | Issuing medical council/board |
| `yearsOfExperience` | `INTEGER` | `NULLABLE` | Professional experience in years |
| `credentialDocumentUrl` | `TEXT` | `NULLABLE` | Document metadata/path |
| `verificationStatus` | `VerificationStatus` | `NOT NULL, DEFAULT 'PENDING', INDEX` | `PENDING`, `APPROVED`, `REJECTED` |
| `rejectionReason` | `TEXT` | `NULLABLE` | Administrative rejection feedback |
| `verifiedAt` | `TIMESTAMP(3)` | `NULLABLE` | Approval timestamp |

### 3.3 Seeded Core Taxonomies
Automated, idempotent seeder (`server/prisma/seed.ts`) populates the 7 core specialties:
1. **General Medicine** (`general-medicine`)
2. **Cardiology** (`cardiology`)
3. **Dermatology** (`dermatology`)
4. **Neurology** (`neurology`)
5. **Orthopedics** (`orthopedics`)
6. **ENT** (`ent`)
7. **Pediatrics** (`pediatrics`)

---

## 4. Security & Business Logic Rules

1. **Email Verification Gate:**
   - `PATCH /api/professionals/me` is guarded by `requireVerifiedEmail`. Unverified accounts receive `403 Forbidden` and cannot submit verification credentials until their email is confirmed.
2. **License Uniqueness Guarantee:**
   - Attempting to submit a `licenseNumber` already claimed by another doctor triggers `409 Conflict`.
3. **Approval Integrity Check:**
   - Administrators cannot approve a doctor whose `licenseNumber` is missing (`400 Bad Request`).
4. **Credential Modification Protection:**
   - If an already `APPROVED` doctor alters critical medical credentials (license number, medical board, or specialty), their status resets to `PENDING` to prevent post-verification credential swapping.
5. **Discovery Boundary (`PROF-04`):**
   - Public doctor search query (`GET /api/doctors`) contains an unbypassable database filter: `where: { verificationStatus: 'APPROVED' }`. Unverified or rejected doctors are completely excluded from patient search.

---

## 5. API Reference Catalog

### 5.1 Specialty Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/specialties` | Public | List all active medical specialties |
| `GET` | `/api/specialties/:slug` | Public | Retrieve single specialty details by slug |

### 5.2 Doctor Profile Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/professionals/me` | Doctor (`DOCTOR`) | Retrieve authenticated doctor profile with verification metadata |
| `PATCH` | `/api/professionals/me` | Verified Doctor | Update doctor profile, consultation fee, and submit license credentials |

### 5.3 Administrative Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/doctors/pending` | Admin (`ADMIN`, `SUPER_ADMIN`) | View paginated pending verification submissions |
| `PATCH` | `/api/admin/doctors/:id/approve` | Admin (`ADMIN`, `SUPER_ADMIN`) | Approve doctor application (sets status to `APPROVED`) |
| `PATCH` | `/api/admin/doctors/:id/reject` | Admin (`ADMIN`, `SUPER_ADMIN`) | Reject doctor application with mandatory rejection reason |

### 5.4 Public Directory Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/doctors` | Public | Search approved doctors by `specialty`, text `search`, `minFee`, and `maxFee` |

---

## 6. Verification & Test Evidence

### 6.1 Full Test Suite (100% Passing)
```
 Test Files  18 passed (18)
      Tests  86 passed (86)
   Duration  ~10s
```

- **Specialty Suite (`specialty.test.ts` - 5 tests):**
  - ✓ Returns list of all active specialties with 200 OK.
  - ✓ Returns empty list when no active specialties exist.
  - ✓ Returns specific specialty by slug with 200 OK.
  - ✓ Returns 404 Not Found when specialty slug does not exist.
  - ✓ Returns 404 Not Found when specialty exists but `isActive` is false.
- **Doctor Profile Suite (`professional.test.ts` - 7 tests):**
  - ✓ Returns doctor profile for authenticated doctor.
  - ✓ Rejects patient access to `/api/professionals/me` with 403 Forbidden.
  - ✓ Rejects unauthenticated requests with 401 Unauthorized.
  - ✓ Updates doctor profile and credentials when email is verified.
  - ✓ Rejects profile mutation when doctor email is unverified with 403 Forbidden (`requireVerifiedEmail`).
  - ✓ Rejects duplicate license number with 409 Conflict.
  - ✓ Rejects invalid specialty ID with 400 Bad Request.
- **Admin Doctor Verification Suite (`admin-doctor.test.ts` - 8 tests):**
  - ✓ Rejects non-admin doctor with 403 Forbidden.
  - ✓ Rejects patient with 403 Forbidden.
  - ✓ Rejects unauthenticated request with 401 Unauthorized.
  - ✓ Returns pending doctors with pagination metadata for admin.
  - ✓ Approves doctor with valid license and updates status to `APPROVED`.
  - ✓ Rejects approval if doctor lacks license number with 400 Bad Request.
  - ✓ Rejects doctor application and records rejection reason.
  - ✓ Validates rejection reason length with 400 Bad Request if too short.
- **Public Doctor Directory Suite (`doctor-directory.test.ts` - 3 tests):**
  - ✓ Returns list of approved doctors without requiring authentication.
  - ✓ Passes search, specialty, and fee filters to repository.
  - ✓ Returns empty list when no approved doctors match criteria.

---

## 7. Frontend Vertical Slice Deliverables (`Plan 02-04`)

Following our 10-phase Full-Stack Vertical Slice methodology, Phase 2 implements rich frontend user interfaces matching the pixel-perfect design specifications in `stitch/stitch_proroute_healthcare_booking_platform/stitch_proroute_healthcare_booking_platform/`:

### 7.1 Implemented Screens & Components

| Route / Component | Stitch Source of Truth | Key Capabilities |
|---|---|---|
| `Navbar.tsx` | Global Header | Frosted glass dark header (`bg-surface/80 backdrop-blur-md`), role-aware pills (`Doctor Profile`, `Admin Portal`), and live user identity badge. |
| `/doctors` & `/` | `proroute_healthcare_landing_page` | Public doctor discovery with real-time text search, 7 specialty filter pills, consultation fee range slider ($50-$500), and doctor cards with glowing verified badges (`verified`). |
| `/doctor/profile` | `proroute_doctor_onboarding_medical_credentials` | Doctor credential onboarding form with verification status banner (`PENDING`, `APPROVED`, `REJECTED`), rejection reason audit card, anti-tampering caution, and email verification blocker banner. |
| `/admin/verifications` | `proroute_admin_doctor_verification_dashboard` | Admin verification queue displaying applicant credentials, 1-click Approve gate (verifying license), and Reject modal with required reason prompt (min 5 characters). |

### 7.2 Client Compilation & Verification
- `npm run build` in `client`: **0 errors**, TypeScript type-checks passed cleanly, Vite production bundle generated in 9.10s.
- Total Backend + Frontend Test Verification: **18 test files, 86/86 server tests passed**, 0 client runtime or compilation warnings.

