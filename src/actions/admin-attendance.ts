"use server"

import { prisma as db } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { calculateEffectiveOvertime } from "@/lib/attendance-utils"
import { syncAlphaAttendance } from "@/lib/sync-alpha"

function parseWibTime(recordDate: string, timeStr: string): Date {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  return new Date(`${recordDate}T${normalizedTime}+07:00`)
}

export async function getUsersForOverride() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  return await db.user.findMany({
    where: { is_active: true },
    select: { id: true, full_name: true, role: true },
    orderBy: { full_name: 'asc' }
  })
}

export async function addOverrideAttendance(data: {
  userId: string;
  recordDate: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';
  clockIn: string | null;
  clockOut: string | null;
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  const recordDateUtc = new Date(`${data.recordDate}T00:00:00.000Z`)

  let clockInDT = parseWibTime(data.recordDate, data.clockIn || '08:00')
  let clockOutDT: Date | null = data.clockOut ? parseWibTime(data.recordDate, data.clockOut) : null

  let duration = null
  if (clockOutDT) {
    duration = Math.round((clockOutDT.getTime() - clockInDT.getTime()) / 60000)
  }

  // Check if exists
  const existing = await db.attendance.findFirst({
    where: {
      user_id: data.userId,
      record_date: recordDateUtc
    }
  })

  if (existing) {
    await db.attendance.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        clock_in: clockInDT,
        clock_out: clockOutDT,
        duration_minutes: duration,
        override_by: session.user.id
      }
    })
  } else {
    await db.attendance.create({
      data: {
        user_id: data.userId,
        record_date: recordDateUtc,
        status: data.status,
        clock_in: clockInDT,
        clock_out: clockOutDT,
        duration_minutes: duration,
        override_by: session.user.id
      }
    })
  }

  revalidatePath('/admin/reports')
  return { success: true }
}

export async function getReportData(startDate: string, endDate: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  // Otomatis tandai ALPHA bagi pengguna aktif yang tidak presensi setelah jam kerja (17:00)
  await syncAlphaAttendance(startDate, endDate)

  const users = await db.user.findMany({
    where: {
      OR: [
        { is_active: true },
        { attendances: { some: { record_date: { gte: start, lte: end } } } }
      ]
    },
    include: {
      attendances: {
        where: {
          record_date: { gte: start, lte: end }
        }
      },
      overtimes: {
        where: {
          request_date: { gte: start, lte: end },
          status: 'APPROVED'
        }
      }
    },
    orderBy: { full_name: 'asc' }
  })

  const report = users.map(user => {
    let jumlahHadir = 0
    let totalMenitKerja = 0

    user.attendances.forEach(att => {
      if (att.status === 'HADIR') {
        jumlahHadir++
        if (att.duration_minutes) {
          totalMenitKerja += att.duration_minutes
        }
      }
    })

    const totalJamKerja = Math.round(totalMenitKerja / 60)

    let lemburWeekday = 0
    let lemburWeekend = 0

    user.overtimes.forEach(ot => {
      const otDate = ot.request_date.toISOString().split('T')[0]
      const matchingAtt = user.attendances.find(a => {
        const aDate = a.record_date.toISOString().split('T')[0]
        return aDate === otDate
      })
      
      const effective = calculateEffectiveOvertime(
        otDate,
        matchingAtt?.clock_in,
        matchingAtt?.clock_out,
        ot.duration_hours
      )
      lemburWeekday += effective.weekdayHours
      lemburWeekend += effective.weekendHours
    })

    const roleName = user.role === 'ADMIN' ? 'Admin' : user.role === 'PM' ? 'Project Manager' : 'Staff'

    return {
      nama: user.full_name,
      jabatan: roleName,
      jumlahHadir,
      totalJamKerja,
      lemburWeekday,
      lemburWeekend
    }
  })

  return report
}

export async function getRawAttendances(startDate: string, endDate: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return await db.attendance.findMany({
    where: { record_date: { gte: start, lte: end } },
    include: { user: { select: { full_name: true } } },
    orderBy: [{ record_date: 'desc' }, { clock_in: 'desc' }]
  })
}

export async function getDailyRecords(startDate: string, endDate: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T23:59:59.999Z`)

  // Otomatis tandai ALPHA bagi pengguna aktif yang tidak presensi setelah jam kerja (17:00)
  await syncAlphaAttendance(startDate, endDate)

  const users = await db.user.findMany({
    where: {
      OR: [
        { is_active: true },
        { attendances: { some: { record_date: { gte: start, lte: end } } } }
      ]
    },
    include: {
      attendances: { where: { record_date: { gte: start, lte: end } } },
      overtimes: { where: { request_date: { gte: start, lte: end } } }
    }
  })

  const records: any[] = []

  users.forEach(user => {
    const datesMap = new Map<string, { attendance?: any, overtime?: any }>()
    
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
    
    datesMap.forEach((data, dateStr) => {
      records.push({
        id: `${user.id}_${dateStr}`,
        user_id: user.id,
        user_name: user.full_name,
        user_role: user.role,
        dateStr: dateStr,
        date: new Date(`${dateStr}T00:00:00.000Z`),
        attendance: data.attendance || null,
        overtime: data.overtime || null
      })
    })
  })

  records.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
  return records
}

export async function saveDailyRecord(data: {
  userId: string;
  recordDate: string;
  attendanceStatus: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | '';
  clockIn: string | null;
  clockOut: string | null;
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  const recordDateUtc = new Date(`${data.recordDate}T00:00:00.000Z`)

  if (data.attendanceStatus !== '') {
    let clockInDT = parseWibTime(data.recordDate, data.clockIn || '08:00')
    let clockOutDT: Date | null = data.clockOut ? parseWibTime(data.recordDate, data.clockOut) : null

    let duration = null
    if (clockOutDT) {
      duration = Math.round((clockOutDT.getTime() - clockInDT.getTime()) / 60000)
    }

    const existingAtt = await db.attendance.findFirst({
      where: {
        user_id: data.userId,
        record_date: recordDateUtc
      }
    })

    if (existingAtt) {
      await db.attendance.update({
        where: { id: existingAtt.id },
        data: {
          status: data.attendanceStatus as any,
          clock_in: clockInDT,
          clock_out: clockOutDT,
          duration_minutes: duration,
          override_by: session.user.id
        }
      })
    } else {
      await db.attendance.create({
        data: {
          user_id: data.userId,
          record_date: recordDateUtc,
          status: data.attendanceStatus as any,
          clock_in: clockInDT,
          clock_out: clockOutDT,
          duration_minutes: duration,
          override_by: session.user.id
        }
      })
    }
  }



  revalidatePath('/admin/reports')
  return { success: true }
}

export async function deleteAttendanceRecord(attendanceId: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized")

  await db.attendance.delete({
    where: { id: attendanceId }
  })

  revalidatePath('/admin/reports')
  revalidatePath('/admin')
  return { success: true }
}
