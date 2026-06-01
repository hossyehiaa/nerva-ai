import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user if it doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nerva.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Nerva@Admin2024';
  const adminName = process.env.ADMIN_NAME || 'Nerva Admin';

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: 'admin',
      },
    });
    console.log(`Admin user created: ${admin.email}`);
    console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
