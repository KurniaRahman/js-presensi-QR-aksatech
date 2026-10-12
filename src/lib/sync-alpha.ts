import { prisma as db } from "@/lib/prisma"
import { isWeekendDay } from "@/lib/attendance-utils"

/**
 * Memastikan semua user aktif (semua role: ADMIN, PM, STAFF) yang tidak presensi
 * setelah melewati jam kerja (pukul 17:00) pada hari kerja (weekday) otomatis tercatat sebagai ALPHA.
 */
export async function syncAlphaAttendance(startDateStr?: string, endDateStr?: string) {
  try {
    const now = new Date()

    // Format tanggal dan jam saat ini berdasarkan zona waktu Indonesia (WIB / Asia/Jakarta)
    const formatterDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayStr = formatterDate.format(now) // Format YYYY-MM-DD

    const formatterHour = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      hour12: false
    })
    const currentHour = parseInt(formatterHour.format(now), 10) // 0 - 23

    // Default rentang: 30 hari ke belakang sampai hari ini
    let startStr = startDateStr
    let endStr = endDateStr

    if (!startStr || !endStr) {
      const defaultStart = new Date(now)
      defaultStart.setDate(defaultStart.getDate() - 30)
      startStr = formatterDate.format(defaultStart)
      endStr = todayStr
    }

    // Jangan proses tanggal di masa depan yang melebihi hari ini
    if (endStr > todayStr) {
      endStr = todayStr
    }

    if (startStr > endStr) {
      return { createdCount: 0 }
    }

    // Kumpulkan tanggal-tanggal hari kerja (Senin - Jumat) yang memenuhi syarat:
    // 1. Hari kerja di masa lalu (< todayStr) -> jam kerja 17:00 sudah pasti terlewati
    // 2. Hari kerja hari ini (=== todayStr) -> HANYA jika jam sekarang sudah >= 17 (jam 5 sore)
    const candidateDates: string[] = []
    const curDate = new Date(`${startStr}T00:00:00.000Z`)
    const targetEndDate = new Date(`${endStr}T00:00:00.000Z`)

    while (curDate <= targetEndDate) {
      const dStr = curDate.toISOString().split('T')[0]

      // Lewati akhir pekan (Sabtu & Minggu bukan hari kerja reguler)
      if (!isWeekendDay(dStr)) {
        if (dStr < todayStr) {
          candidateDates.push(dStr)
        } else if (dStr === todayStr) {
          if (currentHour >= 17) {
            candidateDates.push(dStr)
          }
        }
      }

      curDate.setUTCDate(curDate.getUTCDate() + 1)
    }

    if (candidateDates.length === 0) {
      return { createdCount: 0 }
    }

    // Ambil seluruh akun aktif dari SEMUA ROLE (ADMIN, PM, STAFF)
    const activeUsers = await db.user.findMany({
      where: { is_active: true },
      select: { id: true, created_at: true }
    })

    if (activeUsers.length === 0) {
      return { createdCount: 0 }
    }

    const userIds = activeUsers.map(u => u.id)
    const firstCandidateDate = candidateDates[0]
    const lastCandidateDate = candidateDates[candidateDates.length - 1]

    // Ambil data presensi yang sudah tercatat pada rentang tanggal tersebut
    const existingAttendances = await db.attendance.findMany({
      where: {
        user_id: { in: userIds },
        record_date: {
          gte: new Date(`${firstCandidateDate}T00:00:00.000Z`),
          lte: new Date(`${lastCandidateDate}T23:59:59.999Z`)
        }
      },
      select: {
        user_id: true,
        record_date: true
      }
    })

    // Buat lookup Set agar pengecekan cepat O(1)
    const existingSet = new Set<string>()
    existingAttendances.forEach(att => {
      const dStr = att.record_date.toISOString().split('T')[0]
      existingSet.add(`${att.user_id}_${dStr}`)
    })

    const missingAlphaList: {
      id: string
      user_id: string
      record_date: Date
      clock_in: Date
      clock_out: Date | null
      duration_minutes: number
      status: 'ALPHA'
    }[] = []

    activeUsers.forEach(user => {
      const userCreatedStr = user.created_at ? formatterDate.format(user.created_at) : "2000-01-01"

      candidateDates.forEach(dStr => {
        // Jangan tandai alpha jika tanggal tersebut sebelum akun pengguna dibuat
        if (dStr < userCreatedStr) return

        const key = `${user.id}_${dStr}`
        if (!existingSet.has(key)) {
          const recDate = new Date(`${dStr}T00:00:00.000Z`)
          const [y, m, d] = dStr.split('-').map(Number)
          // Timestamp jam 17:00 sebagai penanda batas akhir jam kerja
          const cutoffTime = new Date(y, m - 1, d, 17, 0, 0, 0)

          missingAlphaList.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            record_date: recDate,
            clock_in: cutoffTime,
            clock_out: null,
            duration_minutes: 0,
            status: 'ALPHA'
          })
          // Tandai sudah ditambahkan
          existingSet.add(key)
        }
      })
    })

    if (missingAlphaList.length > 0) {
      await db.attendance.createMany({
        data: missingAlphaList,
        skipDuplicates: true
      })
    }

    return { createdCount: missingAlphaList.length }
  } catch (error) {
    console.error("Gagal sinkronisasi data ALPHA:", error)
    return { createdCount: 0, error }
  }
}
