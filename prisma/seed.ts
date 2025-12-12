import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Delete existing users if they exist (for re-seeding)
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'admin@musina.gov.za',
            'manager@musina.gov.za',
            'clerk@musina.gov.za',
            'reviewer@musina.gov.za',
            'viewer@musina.gov.za',
          ],
        },
      },
    });
  } catch (error) {
    // Ignore if collection doesn't exist yet
  }

  // Create or update admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@musina.gov.za' },
    update: {
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@musina.gov.za',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  // Create or update manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@musina.gov.za' },
    update: {
      passwordHash: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      isActive: true,
    },
    create: {
      email: 'manager@musina.gov.za',
      passwordHash: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
    },
  });

  // Create or update clerk user
  const clerkPassword = await bcrypt.hash('clerk123', 10);
  const clerk = await prisma.user.upsert({
    where: { email: 'clerk@musina.gov.za' },
    update: {
      passwordHash: clerkPassword,
      firstName: 'Clerk',
      lastName: 'User',
      role: 'CLERK',
      isActive: true,
    },
    create: {
      email: 'clerk@musina.gov.za',
      passwordHash: clerkPassword,
      firstName: 'Clerk',
      lastName: 'User',
      role: 'CLERK',
    },
  });

  // Create or update reviewer user
  const reviewerPassword = await bcrypt.hash('reviewer123', 10);
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@musina.gov.za' },
    update: {
      passwordHash: reviewerPassword,
      firstName: 'Reviewer',
      lastName: 'User',
      role: 'REVIEWER',
      isActive: true,
    },
    create: {
      email: 'reviewer@musina.gov.za',
      passwordHash: reviewerPassword,
      firstName: 'Reviewer',
      lastName: 'User',
      role: 'REVIEWER',
    },
  });

  // Create or update viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@musina.gov.za' },
    update: {
      passwordHash: viewerPassword,
      firstName: 'Viewer',
      lastName: 'User',
      role: 'VIEWER',
      isActive: true,
    },
    create: {
      email: 'viewer@musina.gov.za',
      passwordHash: viewerPassword,
      firstName: 'Viewer',
      lastName: 'User',
      role: 'VIEWER',
    },
  });

  console.log('Created users:', { admin, manager, clerk, reviewer, viewer });
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

