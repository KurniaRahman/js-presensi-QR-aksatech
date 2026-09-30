import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password_hash = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@aksatech.com' },
    update: {},
    create: {
      email: 'admin@aksatech.com',
      full_name: 'Super Admin',
      password_hash,
      role: Role.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'pm@aksatech.com' },
    update: {},
    create: {
      email: 'pm@aksatech.com',
      full_name: 'Project Manager',
      password_hash,
      role: Role.PM,
    },
  })

  await prisma.user.upsert({
    where: { email: 'staff@aksatech.com' },
    update: {},
    create: {
      email: 'staff@aksatech.com',
      full_name: 'Staff Karyawan',
      password_hash,
      role: Role.STAFF,
    },
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
