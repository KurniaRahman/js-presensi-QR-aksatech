"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { calculateEffectiveOvertime, isWeekendDay, EffectiveOvertimeResult } from "@/lib/attendance-utils"
import { syncAlphaAttendance } from "@/lib/sync-alpha"

export interface UserHistoryItem {
  id: string
  dateStr: string
  date: Date
  isWeekend: boolean
  attendance: {
    id: string
    status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA'
    clock_in: Date
    clock_out: Date | null
    duration_minutes: number | null
  } | null
  overtime: {
    id: string
    duration_hours: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    reason: string
  } | null
  effectiveOvertime: EffectiveOvertimeResult
}

export interface UserHistorySummary {
  hadirCount: number
  sakitCount: number
  izinCount: number
  alphaCount: number
  totalWorkMinutes: number
  totalWorkFormatted: string
  totalLemburWeekday: number
  totalLemburWeekend: number
}

export interface UserHistoryResponse {
  summary: UserHistorySummary
  records: UserHistoryItem[]
}

export async function getUserHistoryData(startDate: string, endDate: string): Promise<UserHistoryResponse> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T23:59:59.999Z`)

  // Otomatis sinkronkan ALPHA bagi akun aktif yang tidak presensi setelah jam kerja (17:00)
  await syncAlphaAttendance(startDate, endDate)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      attendances: {
        where: { record_date: { gte: start, lte: end } },
        orderBy: { record_date: 'desc' }
      },
      overtimes: {
        where: { request_date: { gte: start, lte: end } },
        orderBy: { request_date: 'desc' }
      }
    }
  })

  if (!user) throw new Error("User not found")

  const datesMap = new Map<string, { attendance?: any; overtime?: any }>()

  user.attendances.forEach(att => {
    const d = att.record_date.toISOString().split('T')[0]
    if (!datesMap.has(d)) datesMap.set(d, {})
    datesMap.get(d)!.attendance = att
  })

  user.overtimes.forEach(ot => {
    const d = ot.request_date.toISOString().split('T')[0]
    if (!datesMap.has(d)) datesMap.set(d, {})
    datesMap.get(d)!.overtime = ot
  })

  let hadirCount = 0
  let sakitCount = 0
  let izinCount = 0
  let alphaCount = 0
  let totalWorkMinutes = 0
  let totalLemburWeekday = 0
  let totalLemburWeekend = 0

  const records: UserHistoryItem[] = []

  datesMap.forEach((data, dateStr) => {
    const att = data.attendance || null
    const ot = data.overtime || null

    if (att) {
      if (att.status === 'HADIR') {
        hadirCount++
        if (att.duration_minutes) {
          totalWorkMinutes += att.duration_minutes
        }
      } else if (att.status === 'SAKIT') {
        sakitCount++
      } else if (att.status === 'IZIN') {
        izinCount++
      } else if (att.status === 'ALPHA') {
        alphaCount++
      }
    }

    const approvedOtHours = ot?.status === 'APPROVED' ? ot.duration_hours : 0
    const clockInDt = att?.clock_in ? new Date(att.clock_in) : null
    const clockOutDt = att?.clock_out ? new Date(att.clock_out) : null

    const effective = calculateEffectiveOvertime(dateStr, clockInDt, clockOutDt, approvedOtHours)

    totalLemburWeekday += effective.weekdayHours
    totalLemburWeekend += effective.weekendHours

    records.push({
      id: `${user.id}_${dateStr}`,
      dateStr,
      date: new Date(`${dateStr}T00:00:00.000Z`),
      isWeekend: isWeekendDay(dateStr),
      attendance: att,
      overtime: ot,
      effectiveOvertime: effective
    })
  })

  // Urutkan dari tanggal terbaru ke terlama
  records.sort((a, b) => b.dateStr.localeCompare(a.dateStr))

  const hours = Math.floor(totalWorkMinutes / 60)
  const mins = totalWorkMinutes % 60
  const totalWorkFormatted = hours > 0 ? `${hours} Jam ${mins} Menit` : `${mins} Menit`

  return {
    summary: {
      hadirCount,
      sakitCount,
      izinCount,
      alphaCount,
      totalWorkMinutes,
      totalWorkFormatted,
      totalLemburWeekday,
      totalLemburWeekend
    },
    records
  }
}
