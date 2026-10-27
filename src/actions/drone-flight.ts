"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

const ALLOWED_MISSION_TYPES = ["TRAINING", "MISSION"] as const
type MissionType = (typeof ALLOWED_MISSION_TYPES)[number]

function validateDateString(val?: string | null): string {
  if (!val || typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }
  return val
}

function calculateDurationMinutes(takeoff: string, landing: string): number {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(takeoff) || !timeRegex.test(landing)) {
    throw new Error("Format waktu tidak valid (gunakan format HH:mm)")
  }

  const [toH, toM] = takeoff.split(":").map(Number)
  const [ldH, ldM] = landing.split(":").map(Number)

  const takeoffTotal = toH * 60 + toM
  const landingTotal = ldH * 60 + ldM

  let diff = landingTotal - takeoffTotal
  // Jika melewati tengah malam (misal takeoff 23:50, landing 00:15)
  if (diff < 0) {
    diff += 24 * 60
  }

  if (diff <= 0) {
    throw new Error("Jam landing harus lebih lambat dari jam take off")
  }

  return diff
}

/**
 * Mengambil riwayat log penerbangan drone dengan filter opsional
 */
export async function getDroneFlightLogs(filters?: {
  droneId?: string
  startDate?: string
  endDate?: string
  missionType?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM" && session.user.role !== "GUEST") {
    throw new Error("Akses ditolak")
  }

  const whereClause: Prisma.DroneFlightLogWhereInput = {}

  if (filters?.droneId && filters.droneId !== "ALL") {
    whereClause.drone_id = filters.droneId
  }

  if (filters?.startDate || filters?.endDate) {
    const startStr = validateDateString(filters.startDate)
    const endStr = validateDateString(filters.endDate || filters.startDate)
    whereClause.flight_date = {
      gte: new Date(`${startStr}T00:00:00.000Z`),
      lte: new Date(`${endStr}T23:59:59.999Z`),
    }
  }

  if (filters?.missionType && filters.missionType !== "ALL") {
    if (ALLOWED_MISSION_TYPES.includes(filters.missionType as MissionType)) {
      whereClause.mission_type = filters.missionType
    }
  }

  const logs = await db.droneFlightLog.findMany({
    where: whereClause,
    include: {
      drone: {
        select: {
          id: true,
          serial_number: true,
          model_name: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          full_name: true,
          role: true,
          email: true,
        },
      },
    },
    orderBy: [
      { flight_date: "desc" },
      { takeoff_time: "desc" },
      { created_at: "desc" },
    ],
  })

  return { success: true, data: logs }
}

/**
 * Menambahkan catatan log penerbangan baru
 */
export async function createDroneFlightLog(data: {
  drone_id: string
  flight_date: string
  takeoff_time: string
  landing_time: string
  mission_type: string
  battery_1: string
  battery_2?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  if (!data.drone_id) {
    throw new Error("Pilih unit drone terlebih dahulu")
  }

  const drone = await db.drone.findUnique({
    where: { id: data.drone_id },
  })
  if (!drone) {
    throw new Error("Unit drone tidak ditemukan")
  }

  const dateStr = validateDateString(data.flight_date)
  const flightDate = new Date(`${dateStr}T00:00:00.000Z`)

  const cleanTakeoff = data.takeoff_time?.trim()
  const cleanLanding = data.landing_time?.trim()
  if (!cleanTakeoff || !cleanLanding) {
    throw new Error("Jam take off dan jam landing wajib diisi")
  }

  const durationMinutes = calculateDurationMinutes(cleanTakeoff, cleanLanding)

  const cleanMission = ALLOWED_MISSION_TYPES.includes(data.mission_type as MissionType)
    ? data.mission_type
    : "TRAINING"

  const cleanBat1 = data.battery_1?.trim().toUpperCase()
  if (!cleanBat1) {
    throw new Error("Nomor baterai 1 wajib diisi")
  }

  // Model AR dan Revolver membutuhkan 2 baterai
  const isDualBattery = drone.model_name.includes("AR") || drone.model_name.includes("Revolver")
  const cleanBat2 = data.battery_2?.trim().toUpperCase() || null

  if (isDualBattery && !cleanBat2) {
    throw new Error(`Unit ${drone.model_name} memerlukan 2 nomor baterai (Baterai 1 dan Baterai 2)`)
  }

  const newLog = await db.droneFlightLog.create({
    data: {
      drone_id: data.drone_id,
      user_id: session.user.id,
      flight_date: flightDate,
      takeoff_time: cleanTakeoff,
      landing_time: cleanLanding,
      duration_minutes: durationMinutes,
      mission_type: cleanMission,
      battery_1: cleanBat1,
      battery_2: isDualBattery ? cleanBat2 : null,
      notes: data.notes?.trim() || null,
    },
    include: {
      drone: true,
      user: {
        select: { id: true, full_name: true, role: true, email: true },
      },
    },
  })

  revalidatePath("/dashboard/flights")
  return { success: true, data: newLog }
}

/**
 * Memperbarui catatan log penerbangan
 */
export async function updateDroneFlightLog(
  id: string,
  data: {
    flight_date: string
    takeoff_time: string
    landing_time: string
    mission_type: string
    battery_1: string
    battery_2?: string
    notes?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.droneFlightLog.findUnique({
    where: { id },
    include: { drone: true },
  })
  if (!existing) {
    throw new Error("Catatan penerbangan tidak ditemukan")
  }

  // IDOR Protection: Hanya pemilik log atau PM yang berhak mengedit
  if (existing.user_id !== session.user.id && session.user.role !== "PM") {
    throw new Error("Akses ditolak untuk mengedit catatan ini")
  }

  const dateStr = validateDateString(data.flight_date)
  const flightDate = new Date(`${dateStr}T00:00:00.000Z`)

  const cleanTakeoff = data.takeoff_time?.trim()
  const cleanLanding = data.landing_time?.trim()
  if (!cleanTakeoff || !cleanLanding) {
    throw new Error("Jam take off dan jam landing wajib diisi")
  }

  const durationMinutes = calculateDurationMinutes(cleanTakeoff, cleanLanding)

  const cleanMission = ALLOWED_MISSION_TYPES.includes(data.mission_type as MissionType)
    ? data.mission_type
    : existing.mission_type

  const cleanBat1 = data.battery_1?.trim().toUpperCase()
  if (!cleanBat1) {
    throw new Error("Nomor baterai 1 wajib diisi")
  }

  const isDualBattery = existing.drone.model_name.includes("AR") || existing.drone.model_name.includes("Revolver")
  const cleanBat2 = data.battery_2?.trim().toUpperCase() || null

  if (isDualBattery && !cleanBat2) {
    throw new Error(`Unit ${existing.drone.model_name} memerlukan 2 nomor baterai`)
  }

  const updated = await db.droneFlightLog.update({
    where: { id },
    data: {
      flight_date: flightDate,
      takeoff_time: cleanTakeoff,
      landing_time: cleanLanding,
      duration_minutes: durationMinutes,
      mission_type: cleanMission,
      battery_1: cleanBat1,
      battery_2: isDualBattery ? cleanBat2 : null,
      notes: data.notes?.trim() || null,
    },
    include: {
      drone: true,
      user: {
        select: { id: true, full_name: true, role: true, email: true },
      },
    },
  })

  revalidatePath("/dashboard/flights")
  return { success: true, data: updated }
}

/**
 * Menghapus catatan log penerbangan
 */
export async function deleteDroneFlightLog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.droneFlightLog.findUnique({
    where: { id },
  })
  if (!existing) {
    throw new Error("Catatan penerbangan tidak ditemukan")
  }

  // IDOR Protection: Hanya pembuat log atau PM yang dapat menghapus
  if (existing.user_id !== session.user.id && session.user.role !== "PM") {
    throw new Error("Akses ditolak untuk menghapus catatan ini")
  }

  await db.droneFlightLog.delete({
    where: { id },
  })

  revalidatePath("/dashboard/flights")
  return { success: true }
}
