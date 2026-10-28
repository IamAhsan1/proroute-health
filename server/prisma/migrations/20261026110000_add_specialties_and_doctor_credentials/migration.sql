-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "credentialDocumentUrl" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "medicalBoard" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "yearsOfExperience" INTEGER;

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");

-- CreateIndex
CREATE INDEX "Specialty_slug_idx" ON "Specialty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_licenseNumber_key" ON "Professional"("licenseNumber");

-- CreateIndex
CREATE INDEX "Professional_verificationStatus_idx" ON "Professional"("verificationStatus");

-- CreateIndex
CREATE INDEX "Professional_specialtyId_idx" ON "Professional"("specialtyId");

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
