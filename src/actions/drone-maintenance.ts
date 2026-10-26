"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateStringWIB } from "@/lib/attendance-utils"

const ALLOWED_MAINTENANCE_TYPES = ["INSPECTION", "REPAIR", "REPLACEMENT"] as const
const ALLOWED_DRONE_STATUSES = ["READY", "IN_MAINTENANCE", "RETIRED"] as const

function validateDateString(dateStr?: string): string {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T00:00:00.000Z`)
    if (!isNaN(d.getTime())) return dateStr
  }
  return getDateStringWIB(new Date())
}

/**
 * Mengambil seluruh data unit armada drone beserta rekap servis terakhir
 */
export async function getDrones() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const drones = await db.drone.findMany({
    include: {
      _count: {
        select: { maintenance_logs: true },
      },
      maintenance_logs: {
        take: 1,
        orderBy: [{ maintenance_date: "desc" }, { created_at: "desc" }],
        select: {
          maintenance_date: true,
          maintenance_type: true,
          action_taken: true,
          user: {
            select: { full_name: true },
          },
        },
      },
    },
    orderBy: [
      { model_name: "asc" },
      { serial_number: "asc" },
    ],
  })

  return { success: true, data: drones }
}

/**
 * Menambahkan master data unit drone baru
 */
export async function createDrone(data: {
  serial_number: string
  model_name: string
  status?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const cleanSN = data.serial_number?.trim().toUpperCase()
  if (!cleanSN) {
    throw new Error("Serial Number (SN) drone wajib diisi")
  }

  const cleanModel = data.model_name?.trim()
  if (!cleanModel) {
    throw new Error("Model drone wajib diisi")
  }

  const existing = await db.drone.findUnique({
    where: { serial_number: cleanSN },
  })
  if (existing) {
    throw new Error(`Drone dengan Serial Number "${cleanSN}" sudah terdaftar`)
  }

  const safeStatus = ALLOWED_DRONE_STATUSES.includes(data.status as any)
    ? data.status!
    : "READY"

  const newDrone = await db.drone.create({
    data: {
      serial_number: cleanSN,
      model_name: cleanModel,
      status: safeStatus,
      notes: data.notes?.trim() || null,
    },
  })

  revalidatePath("/dashboard/drones")
  return { success: true, data: newDrone }
}

/**
 * Memperbarui data unit drone
 */
export async function updateDrone(
  id: string,
  data: {
    serial_number: string
    model_name: string
    status: string
    notes?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const cleanSN = data.serial_number?.trim().toUpperCase()
  if (!cleanSN) throw new Error("Serial Number wajib diisi")
  const cleanModel = data.model_name?.trim()
  if (!cleanModel) throw new Error("Model drone wajib diisi")

  // Pastikan SN tidak bentrok dengan ID drone lain
  const conflict = await db.drone.findFirst({
    where: {
      serial_number: cleanSN,
      NOT: { id },
    },
  })
  if (conflict) {
    throw new Error(`Serial Number "${cleanSN}" sudah digunakan oleh unit lain`)
  }

  const safeStatus = ALLOWED_DRONE_STATUSES.includes(data.status as any)
    ? data.status
    : "READY"

  const updated = await db.drone.update({
    where: { id },
    data: {
      serial_number: cleanSN,
      model_name: cleanModel,
      status: safeStatus,
      notes: data.notes?.trim() || null,
    },
  })

  revalidatePath("/dashboard/drones")
  return { success: true, data: updated }
}

/**
 * Menghapus unit drone
 */
export async function deleteDrone(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Hanya PM yang dapat menghapus armada drone
  if (session.user.role !== "PM") {
    throw new Error("Hanya Project Manager yang dapat menghapus unit drone")
  }

  await db.drone.delete({
    where: { id },
  })

  revalidatePath("/dashboard/drones")
  return { success: true }
}

/**
 * Mengambil riwayat log perawatan drone (opsional filter per drone, rentang tanggal, & jenis)
 */
export async function getDroneMaintenanceLogs(filters?: {
  droneId?: string
  startDate?: string
  endDate?: string
  type?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const whereClause: any = {}

  if (filters?.droneId && filters.droneId !== "ALL") {
    whereClause.drone_id = filters.droneId
  }

  if (filters?.startDate || filters?.endDate) {
    const startStr = validateDateString(filters.startDate)
    const endStr = validateDateString(filters.endDate || filters.startDate)
    whereClause.maintenance_date = {
      gte: new Date(`${startStr}T00:00:00.000Z`),
      lte: new Date(`${endStr}T23:59:59.999Z`),
    }
  }

  if (filters?.type && filters.type !== "ALL") {
    if (ALLOWED_MAINTENANCE_TYPES.includes(filters.type as any)) {
      whereClause.maintenance_type = filters.type
    }
  }

  const logs = await db.droneMaintenanceLog.findMany({
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
      { maintenance_date: "desc" },
      { created_at: "desc" },
    ],
  })

  return { success: true, data: logs }
}

/**
 * Menambahkan catatan riwayat perawatan drone
 */
export async function createMaintenanceLog(data: {
  drone_id: string
  maintenance_date: string
  maintenance_type: string
  issue_indication: string
  action_taken: string
  additional_notes?: string
  update_drone_status?: string
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

  const dateStr = validateDateString(data.maintenance_date)
  const maintenanceDate = new Date(`${dateStr}T00:00:00.000Z`)

  const cleanType = ALLOWED_MAINTENANCE_TYPES.includes(data.maintenance_type as any)
    ? data.maintenance_type
    : "INSPECTION"

  const cleanIssue = data.issue_indication?.trim()
  if (!cleanIssue) {
    throw new Error("Indikasi masalah / kendala wajib diisi")
  }

  const cleanAction = data.action_taken?.trim()
  if (!cleanAction) {
    throw new Error("Tindakan penanganan wajib diisi")
  }

  const newLog = await db.droneMaintenanceLog.create({
    data: {
      drone_id: data.drone_id,
      user_id: session.user.id,
      maintenance_date: maintenanceDate,
      maintenance_type: cleanType,
      issue_indication: cleanIssue,
      action_taken: cleanAction,
      additional_notes: data.additional_notes?.trim() || null,
    },
    include: {
      drone: true,
      user: {
        select: { id: true, full_name: true, role: true, email: true },
      },
    },
  })

  // Perbarui status drone jika diminta
  if (data.update_drone_status && ALLOWED_DRONE_STATUSES.includes(data.update_drone_status as any)) {
    await db.drone.update({
      where: { id: data.drone_id },
      data: { status: data.update_drone_status },
    })
  }

  revalidatePath("/dashboard/drones")
  return { success: true, data: newLog }
}

/**
 * Memperbarui catatan perawatan
 */
export async function updateMaintenanceLog(
  id: string,
  data: {
    maintenance_date: string
    maintenance_type: string
    issue_indication: string
    action_taken: string
    additional_notes?: string
    update_drone_status?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.droneMaintenanceLog.findUnique({
    where: { id },
  })
  if (!existing) {
    throw new Error("Catatan perawatan tidak ditemukan")
  }

  // IDOR Protection: Hanya pemilik log atau PM yang berhak mengedit
  if (existing.user_id !== session.user.id && session.user.role !== "PM") {
    throw new Error("Akses ditolak untuk mengedit catatan ini")
  }

  const dateStr = validateDateString(data.maintenance_date)
  const maintenanceDate = new Date(`${dateStr}T00:00:00.000Z`)

  const cleanType = ALLOWED_MAINTENANCE_TYPES.includes(data.maintenance_type as any)
    ? data.maintenance_type
    : existing.maintenance_type

  const cleanIssue = data.issue_indication?.trim()
  if (!cleanIssue) throw new Error("Indikasi masalah wajib diisi")

  const cleanAction = data.action_taken?.trim()
  if (!cleanAction) throw new Error("Tindakan penanganan wajib diisi")

  const updated = await db.droneMaintenanceLog.update({
    where: { id },
    data: {
      maintenance_date: maintenanceDate,
      maintenance_type: cleanType,
      issue_indication: cleanIssue,
      action_taken: cleanAction,
      additional_notes: data.additional_notes?.trim() || null,
    },
    include: {
      drone: true,
      user: {
        select: { id: true, full_name: true, role: true, email: true },
      },
    },
  })

  if (data.update_drone_status && ALLOWED_DRONE_STATUSES.includes(data.update_drone_status as any)) {
    await db.drone.update({
      where: { id: existing.drone_id },
      data: { status: data.update_drone_status },
    })
  }

  revalidatePath("/dashboard/drones")
  return { success: true, data: updated }
}

/**
 * Menghapus catatan perawatan
 */
export async function deleteMaintenanceLog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.droneMaintenanceLog.findUnique({
    where: { id },
  })
  if (!existing) {
    throw new Error("Catatan perawatan tidak ditemukan")
  }

  // IDOR Protection: Hanya pemilik log atau PM yang berhak menghapus
  if (existing.user_id !== session.user.id && session.user.role !== "PM") {
    throw new Error("Akses ditolak untuk menghapus catatan ini")
  }

  await db.droneMaintenanceLog.delete({
    where: { id },
  })

  revalidatePath("/dashboard/drones")
  return { success: true }
}
