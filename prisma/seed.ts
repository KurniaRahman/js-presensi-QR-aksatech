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

  // Inisialisasi Armada Drone Awal
  const initialDrones = [
    // Model AR
    { serial_number: 'FA-6065', model_name: 'Model AR' },
    { serial_number: 'FA-6066', model_name: 'Model AR' },
    { serial_number: 'FA-6067', model_name: 'Model AR' },
    { serial_number: 'FA-6068', model_name: 'Model AR' },
    { serial_number: 'FA-6069', model_name: 'Model AR' },
    { serial_number: 'FA-6070', model_name: 'Model AR' },
    // Model TR
    { serial_number: 'FT-6085', model_name: 'Model TR' },
    { serial_number: 'FT-6086', model_name: 'Model TR' },
    { serial_number: 'FT-6087', model_name: 'Model TR' },
    { serial_number: 'FT-6088', model_name: 'Model TR' },
    // Model Revolver
    { serial_number: 'FR-6113', model_name: 'Model Revolver' },
    { serial_number: 'FR-6114', model_name: 'Model Revolver' },
    { serial_number: 'FR-6115', model_name: 'Model Revolver' },
    { serial_number: 'FR-6116', model_name: 'Model Revolver' },
  ]

  for (const drone of initialDrones) {
    await prisma.drone.upsert({
      where: { serial_number: drone.serial_number },
      update: { model_name: drone.model_name },
      create: {
        serial_number: drone.serial_number,
        model_name: drone.model_name,
        status: 'READY',
      },
    })
  }

  console.log('Seeding completed: Default Users, Office Geofence, and 14 Initial Drones initialized.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
