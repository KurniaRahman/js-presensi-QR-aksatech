"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function processAttendance(qrCode: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: "Sesi telah habis, silakan login kembali." }
  
  const cleanQr = qrCode.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
  if (cleanQr !== "AKSA_TECH_ATTENDANCE") {
    return { success: false, message: "QR Code tidak valid atau bukan milik sistem presensi Aksa Tech!" }
  }

  const userId = session.user.id

  // Dapatkan rentang waktu hari ini
  const todayStart = new Date()
  todayStart.setHours(0,0,0,0)
  
  const todayEnd = new Date()
  todayEnd.setHours(23,59,59,999)

  const existingAttendance = await db.attendance.findFirst({
    where: {
      user_id: userId,
      record_date: {
        gte: todayStart,
        lte: todayEnd,
      }
    }
  })

  const now = new Date()

  // Cooldown check 15 menit
  if (existingAttendance) {
    const lastScan = existingAttendance.clock_out || existingAttendance.clock_in
    if (lastScan) {
      const diffMinutes = (now.getTime() - lastScan.getTime()) / (1000 * 60)
      if (diffMinutes < 1) { // 1 menit untuk testing, aslinya 15 menit
         return { success: false, message: "Harap tunggu beberapa saat sebelum memindai lagi (Cooldown aktif)." }
      }
    }
  }

  // Jika belum absen hari ini -> CLOCK IN
  if (!existingAttendance) {
    await db.attendance.create({
      data: {
        user_id: userId,
        record_date: now,
        clock_in: now,
        status: "HADIR",
      }
    })
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    return { success: true, message: "Berhasil Clock-In! Selamat bekerja." }
  }

  // Jika sudah clock-in tapi belum clock-out -> CLOCK OUT
  if (!existingAttendance.clock_out) {
    const diffMs = now.getTime() - existingAttendance.clock_in.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    await db.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        clock_out: now,
        duration_minutes: diffMins,
      }
    })
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    return { success: true, message: "Berhasil Clock-Out! Terima kasih atas kerja keras Anda." }
  }

  // Jika sudah clock in dan clock out -> Selesai
  return { success: false, message: "Anda sudah menyelesaikan seluruh presensi hari ini." }
}
