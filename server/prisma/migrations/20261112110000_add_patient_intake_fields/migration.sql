-- AlterTable
ALTER TABLE "Patient"
ADD COLUMN "dateOfBirth" DATE,
ADD COLUMN "gender" TEXT,
ADD COLUMN "bloodGroup" TEXT,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;

