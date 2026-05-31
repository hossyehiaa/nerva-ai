import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@nerva.ai';
  const adminPassword = 'NervaAdmin2024!';

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    // Update to ensure admin role
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin' },
    });
    console.log('Admin user already exists. Updated role to admin.');
    console.log('Email:', adminEmail);
    return;
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Nerva Admin',
      passwordHash,
      role: 'admin',
    },
  });

  console.log('Admin user created successfully!');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('ID:', admin.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
