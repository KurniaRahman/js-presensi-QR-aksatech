"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitOvertime(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const dateStr = formData.get("request_date") as string
    const durationStr = formData.get("duration_hours") as string
    const reason = formData.get("reason") as string

    if (!dateStr || !durationStr || !reason) {
      return { success: false, message: "Semua field harus diisi" }
    }

    const duration = parseInt(durationStr, 10)
    if (isNaN(duration) || duration < 1) {
      return { success: false, message: "Durasi tidak valid" }
    }

    const [y, m, d] = dateStr.split('-').map(Number)
    const requestDateUtc = new Date(`${dateStr}T00:00:00.000Z`)
    const day = new Date(y, m - 1, d).getDay()
    const isWeekend = day === 0 || day === 6

    if (isWeekend && duration > 8) {
      return { success: false, message: "Maksimal lembur akhir pekan adalah 8 jam." }
    }
    if (!isWeekend && duration > 3) {
      return { success: false, message: "Maksimal lembur hari kerja adalah 3 jam." }
    }

    const now = new Date()

    // Validasi backdate: hanya bulan berjalan
    if (
      (m - 1) !== now.getMonth() ||
      y !== now.getFullYear()
    ) {
      return { 
        success: false, 
        message: "Pengajuan lembur hanya diperbolehkan untuk bulan berjalan."
      }
    }

    // Validasi future date
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const requestDateOnly = new Date(y, m - 1, d)
    if (requestDateOnly > today) {
      return { success: false, message: "Tidak dapat mengajukan lembur untuk tanggal di masa depan." }
    }

    // Validasi Duplikasi: 1x per hari
    const existingOvertime = await db.overtime.findFirst({
      where: {
        user_id: session.user.id,
        request_date: requestDateUtc,
        status: {
          in: ["PENDING", "APPROVED"]
        }
      }
    })

    if (existingOvertime) {
      return { success: false, message: "Anda sudah mengajukan lembur untuk tanggal tersebut." }
    }

    // Insert Data
    await db.overtime.create({
      data: {
        user_id: session.user.id,
        request_date: requestDateUtc,
        duration_hours: duration,
        reason: reason,
        status: "PENDING"
      }
    })

    revalidatePath("/dashboard/overtimes")
    revalidatePath("/dashboard")
    
    return { success: true, message: "Pengajuan lembur berhasil dikirim." }

  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan pada server" }
  }
}
