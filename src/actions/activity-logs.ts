"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateStringWIB } from "@/lib/attendance-utils"

const ALLOWED_STATUSES = ["DONE", "IN_PROGRESS", "PENDING"] as const

function validateDateString(dateStr?: string): string {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T00:00:00.000Z`)
    if (!isNaN(d.getTime())) return dateStr
  }
  return getDateStringWIB(new Date())
}

export async function getActivityLogs(startDateStr?: string, endDateStr?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Hanya STAFF (Engineer) dan PM yang memiliki akses ke Log Aktivitas
  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const startStr = validateDateString(startDateStr)
  const endStr = validateDateString(endDateStr || startDateStr)
  const startOfDay = new Date(`${startStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${endStr}T23:59:59.999Z`)

  const logs = await db.activityLog.findMany({
    where: {
      user_id: session.user.id,
      log_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: [
      { log_date: "desc" },
      { created_at: "desc" },
    ],
  })

  return { success: true, data: logs }
}

export async function getTeamActivityLogs(
  startDateStr?: string,
  endDateStr?: string,
  staffUserId?: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Hanya PM yang dapat memonitor log tim
  if (session.user.role !== "PM") {
    throw new Error("Akses monitoring hanya untuk Project Manager")
  }

  const startStr = validateDateString(startDateStr)
  const endStr = validateDateString(endDateStr || startDateStr)
  const startOfDay = new Date(`${startStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${endStr}T23:59:59.999Z`)

  const whereClause: any = {
    log_date: {
      gte: startOfDay,
      lte: endOfDay,
    },
  }

  // Jika memfilter engineer tertentu (UUID valid)
  if (staffUserId && staffUserId !== "ALL") {
    if (/^[0-9a-fA-F-]{36}$/.test(staffUserId)) {
      whereClause.user_id = staffUserId
    }
  }

  const logs = await db.activityLog.findMany({
    where: whereClause,
    include: {
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
      { log_date: "desc" },
      { user: { full_name: "asc" } },
      { created_at: "desc" },
    ],
  })

  return { success: true, data: logs }
}

export async function getTeamMembersForFilter() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "PM") {
    throw new Error("Akses hanya untuk Project Manager")
  }

  // Hanya anggota dengan role STAFF (Engineer) yang wajib/diizinkan melapor aktivitas harian
  const members = await db.user.findMany({
    where: {
      role: "STAFF",
      is_active: true,
    },
    select: {
      id: true,
      full_name: true,
      role: true,
      email: true,
    },
    orderBy: {
      full_name: "asc",
    },
  })

  return { success: true, data: members }
}

export async function createActivityLog(formData: {
  title: string
  description: string
  status?: string
  dateStr?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role !== "STAFF" && session.user.role !== "PM") {
    throw new Error("Akses ditolak")
  }

  const cleanTitle = formData.title?.trim()
  if (!cleanTitle) {
    throw new Error("Judul tugas wajib diisi")
  }
  if (cleanTitle.length > 255) {
    throw new Error("Judul tugas maksimal 255 karakter")
  }

  const cleanDesc = (formData.description || "").trim()
  if (cleanDesc.length > 5000) {
    throw new Error("Deskripsi tugas maksimal 5000 karakter")
  }

  const safeStatus = ALLOWED_STATUSES.includes(formData.status as any) 
    ? formData.status! 
    : "DONE"

  const targetDateStr = validateDateString(formData.dateStr)
  const logDate = new Date(`${targetDateStr}T00:00:00.000Z`)

  const newLog = await db.activityLog.create({
    data: {
      user_id: session.user.id,
      log_date: logDate,
      title: cleanTitle,
      description: cleanDesc,
      status: safeStatus,
    },
  })

  revalidatePath("/dashboard/activities")
  return { success: true, data: newLog }
}

export async function updateActivityLog(
  id: string,
  formData: {
    title: string
    description: string
    status: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    throw new Error("ID catatan aktivitas tidak valid")
  }

  const existing = await db.activityLog.findUnique({
    where: { id },
  })

  // IDOR Protection: User hanya bisa mengubah log milik mereka sendiri
  if (!existing || existing.user_id !== session.user.id) {
    throw new Error("Catatan aktivitas tidak ditemukan atau akses ditolak")
  }

  const cleanTitle = formData.title?.trim()
  if (!cleanTitle) {
    throw new Error("Judul tugas wajib diisi")
  }
  if (cleanTitle.length > 255) {
    throw new Error("Judul tugas maksimal 255 karakter")
  }

  const cleanDesc = (formData.description || "").trim()
  if (cleanDesc.length > 5000) {
    throw new Error("Deskripsi tugas maksimal 5000 karakter")
  }

  const safeStatus = ALLOWED_STATUSES.includes(formData.status as any) 
    ? formData.status 
    : existing.status

  const updated = await db.activityLog.update({
    where: { id },
    data: {
      title: cleanTitle,
      description: cleanDesc,
      status: safeStatus,
    },
  })

  revalidatePath("/dashboard/activities")
  return { success: true, data: updated }
}

export async function deleteActivityLog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    throw new Error("ID catatan aktivitas tidak valid")
  }

  const existing = await db.activityLog.findUnique({
    where: { id },
  })

  // IDOR Protection: User hanya bisa menghapus log milik mereka sendiri
  if (!existing || existing.user_id !== session.user.id) {
    throw new Error("Catatan aktivitas tidak ditemukan atau akses ditolak")
  }

  await db.activityLog.delete({
    where: { id },
  })

  revalidatePath("/dashboard/activities")
  return { success: true }
}
