import { PrismaClient, Role, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

export const CORE_SPECIALTIES = [
  {
    name: 'General Medicine',
    slug: 'general-medicine',
    description: 'Comprehensive primary healthcare, routine checkups, acute conditions, and chronic disease management.',
    icon: 'stethoscope',
  },
  {
    name: 'Cardiology',
    slug: 'cardiology',
    description: 'Diagnosis and treatment of heart conditions, cardiovascular health, hypertension, and arrhythmias.',
    icon: 'heart-pulse',
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    description: 'Skin health, dermatological diagnostics, hair, nails, and allergic skin conditions.',
    icon: 'sparkles',
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    description: 'Brain, spinal cord, and nervous system disorders, migraines, neuropathies, and stroke prevention.',
    icon: 'brain',
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    description: 'Bones, joints, ligaments, tendons, musculoskeletal trauma, sports injuries, and spine health.',
    icon: 'bone',
  },
  {
    name: 'ENT',
    slug: 'ent',
    description: 'Ear, nose, throat, sinus disorders, hearing health, voice conditions, and neck surgery.',
    icon: 'ear',
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    description: 'Childhood healthcare, infant nutrition, developmental milestones, vaccinations, and adolescent care.',
    icon: 'baby',
  },
];

export async function seedSpecialties() {
  console.log('Seeding core medical specialties...');

  for (const item of CORE_SPECIALTIES) {
    const specialty = await prisma.specialty.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        icon: item.icon,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        icon: item.icon,
        isActive: true,
      },
    });
    console.log(`- Upserted specialty: ${specialty.name} (${specialty.slug})`);
  }

  console.log(`Successfully seeded ${CORE_SPECIALTIES.length} core specialties.`);
}

export async function seedAdmins() {
  console.log('Seeding Admin and Super Admin accounts...');

  const argonOptions = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  };

  const adminHash = await argon2.hash('Admin123!', argonOptions);
  const superAdminHash = await argon2.hash('SuperAdmin123!', argonOptions);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@proroute.com' },
    update: {
      role: Role.ADMIN,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      passwordHash: adminHash,
    },
    create: {
      email: 'admin@proroute.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      patient: {
        create: {
          name: 'Platform Administrator',
        },
      },
    },
  });
  console.log(`- Upserted Admin: ${adminUser.email} (Role: ${adminUser.role})`);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@proroute.com' },
    update: {
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      passwordHash: superAdminHash,
    },
    create: {
      email: 'superadmin@proroute.com',
      passwordHash: superAdminHash,
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      patient: {
        create: {
          name: 'Root Super Administrator',
        },
      },
    },
  });
  console.log(`- Upserted Super Admin: ${superAdminUser.email} (Role: ${superAdminUser.role})`);
}

async function main() {
  try {
    await seedSpecialties();
    await seedAdmins();
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute directly if run as main entrypoint
if (process.argv[1]?.endsWith('seed.ts')) {
  main();
}
