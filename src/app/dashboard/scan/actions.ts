"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isWeekendDay, getDateStringWIB } from "@/lib/attendance-utils"
import { syncAlphaAttendance } from "@/lib/sync-alpha"
import { validateUserOfficeLocation } from "@/lib/geo-utils"

export async function processAttendance(qrCode: string, latitude?: number, longitude?: number) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: "Sesi telah habis, silakan login kembali." }

  // 1. Validasi Keberadaan Koordinat GPS
  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    return { 
      success: false, 
      message: "Koordinat lokasi tidak terdeteksi. Harap pastikan GPS dan izin lokasi browser aktif." 
    }
  }

  // 2. Validasi Geofence Radius Kantor Aksa Tech
  const geoCheck = await validateUserOfficeLocation(latitude, longitude)
  if (!geoCheck.allowed) {
    return {
      success: false,
      message: `Presensi ditolak. Anda berada di luar radius kantor (${geoCheck.distanceMeters.toLocaleString('id-ID')} m dari kantor. Batas toleransi: ${geoCheck.allowedRadiusMeters} m).`
    }
  }

  const cleanQr = qrCode.trim().replace(/^["']+|["']+$/g, '')
  if (cleanQr !== "AKSA_TECH_ATTENDANCE") {
    return { success: false, message: "QR Code tidak valid atau bukan milik sistem presensi Aksa Tech!" }
  }

  const userId = session.user.id

  const now = new Date()
  const todayStr = getDateStringWIB(now)
  const todayRecordDate = new Date(`${todayStr}T00:00:00.000Z`)

  const existingAttendance = await db.attendance.findFirst({
    where: {
      user_id: userId,
      record_date: todayRecordDate
    }
  })

  // Jika status presensi bukan HADIR (misal ALPHA, SAKIT, IZIN)
  if (existingAttendance) {
    if (existingAttendance.status === 'ALPHA') {
      return { success: false, message: "Jam kerja reguler telah berakhir (pukul 17:00) dan status Anda tercatat Alpha hari ini." }
    }
    if (existingAttendance.status === 'SAKIT') {
      return { success: false, message: "Status presensi Anda hari ini tercatat Sakit." }
    }
    if (existingAttendance.status === 'IZIN') {
      return { success: false, message: "Status presensi Anda hari ini tercatat Izin." }
    }
  }

  // Jika belum absen dan hari ini adalah hari kerja (weekday) serta sudah melewati jam 17:00
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(now),
    10
  )
  if (!existingAttendance && !isWeekendDay(todayRecordDate) && currentHour >= 17) {
    await syncAlphaAttendance()
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    return { success: false, message: "Jam kerja reguler telah berakhir (pukul 17:00). Anda tidak melakukan presensi tepat waktu dan tercatat Alpha hari ini." }
  }

  // Cooldown check 15 menit
  if (existingAttendance) {
    const lastScan = existingAttendance.clock_out || existingAttendance.clock_in
    if (lastScan) {
      const diffMinutes = (now.getTime() - lastScan.getTime()) / (1000 * 60)
      if (diffMinutes < 15) { 
         return { success: false, message: "Harap tunggu beberapa saat sebelum memindai lagi (Cooldown aktif)." }
      }
    }
  }

  // Jika belum absen hari ini -> CLOCK IN
  if (!existingAttendance) {
    try {
      await db.attendance.create({
        data: {
          user_id: userId,
          record_date: todayRecordDate,
          clock_in: now,
          status: "HADIR",
        }
      })
      revalidatePath('/dashboard')
      revalidatePath('/admin')
      return { success: true, message: "Berhasil Clock-In! Selamat bekerja." }
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint failed') || err.message?.includes('unique constraint')) {
        return { success: false, message: "Presensi hari ini sudah tercatat (duplikasi dicegah oleh sistem)." }
      }
      throw err
    }
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
