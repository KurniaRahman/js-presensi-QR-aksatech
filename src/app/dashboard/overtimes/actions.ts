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

    if (duration > 3) {
      return { success: false, message: "Maksimal lembur harian adalah 3 jam." }
    }

    const requestDate = new Date(dateStr)
    const now = new Date()

    // Validasi backdate: hanya bulan berjalan
    if (
      requestDate.getMonth() !== now.getMonth() ||
      requestDate.getFullYear() !== now.getFullYear()
    ) {
      return { 
        success: false, 
        message: "Pengajuan lembur hanya diperbolehkan untuk bulan berjalan."
      }
    }

    // Validasi future date
    if (requestDate > now) {
      // Jika tanggal pengajuan besok atau lusa, mungkin ditolak. Kita izinkan jika hanya jam berbeda.
      // Tapi bandingkan tanpa time component.
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const requestDateOnly = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate())
      if (requestDateOnly > today) {
        return { success: false, message: "Tidak dapat mengajukan lembur untuk tanggal di masa depan." }
      }
    }

    // Validasi Duplikasi: 1x per hari
    const startOfDay = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

    const existingOvertime = await db.overtime.findFirst({
      where: {
        user_id: session.user.id,
        request_date: {
          gte: startOfDay,
          lte: endOfDay,
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
        request_date: startOfDay,
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
