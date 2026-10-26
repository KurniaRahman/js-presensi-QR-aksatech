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
    where: { email: 'engineer@aksatech.com' },
    update: {},
    create: {
      email: 'engineer@aksatech.com',
      full_name: 'Engineer Aksa Tech',
      password_hash,
      role: Role.STAFF,
    },
  })

  // Inisialisasi Titik Geofence Kantor PT Aksa Tech Indonesia
  await prisma.systemSetting.upsert({
    where: { key: 'OFFICE_LATITUDE' },
    update: { value: '-7.877989458768671' },
    create: { key: 'OFFICE_LATITUDE', value: '-7.877989458768671' },
  })
  await prisma.systemSetting.upsert({
    where: { key: 'OFFICE_LONGITUDE' },
    update: { value: '110.31851240674597' },
    create: { key: 'OFFICE_LONGITUDE', value: '110.31851240674597' },
  })
  await prisma.systemSetting.upsert({
    where: { key: 'OFFICE_RADIUS_METERS' },
    update: { value: '100' },
    create: { key: 'OFFICE_RADIUS_METERS', value: '100' },
  })

  console.log('Seeding completed: Default Users & Office Geofence Coordinates initialized.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
