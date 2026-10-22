export type OvertimeValidationStatus = 'VALID' | 'EARLY_LEAVE' | 'NO_CLOCK_OUT' | 'NO_OVERTIME'

export interface EffectiveOvertimeResult {
  isWeekend: boolean
  effectiveHours: number
  actualHours: number
  approvedHours: number
  status: OvertimeValidationStatus
  badgeText: string | null
  weekdayHours: number
  weekendHours: number
}

export function getDateStringWIB(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date)
}

export function formatTimeWIB(date: Date | string | null | undefined, fallback: string = '--:--'): string {
  if (!date) return fallback
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return fallback
  return d.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatDateWIB(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '-'
): string {
  if (!date) return fallback
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return fallback
  return d.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    ...options
  })
}

export function isWeekendDay(dateOrStr: Date | string | null | undefined): boolean {
  if (!dateOrStr) return false
  if (typeof dateOrStr === 'string') {
    // Format YYYY-MM-DD
    const [y, m, d] = dateOrStr.split('-').map(Number)
    if (!y || !m || !d) return false
    const dateObj = new Date(y, m - 1, d)
    const day = dateObj.getDay()
    return day === 0 || day === 6
  } else {
    const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(dateOrStr)
    return dayStr === 'Sat' || dayStr === 'Sun'
  }
}

export function calculateEffectiveOvertime(
  dateOrStr: Date | string | null | undefined,
  clockIn: Date | null | undefined,
  clockOut: Date | null | undefined,
  approvedOvertimeHours: number
): EffectiveOvertimeResult {
  const isWeekend = isWeekendDay(dateOrStr || clockOut || clockIn)

  if (approvedOvertimeHours <= 0) {
    return {
      isWeekend,
      effectiveHours: 0,
      actualHours: 0,
      approvedHours: 0,
      status: 'NO_OVERTIME',
      badgeText: null,
      weekdayHours: 0,
      weekendHours: 0
    }
  }

  // Jika ada lembur yang di-approve tapi belum ada jam keluar
  if (!clockOut) {
    return {
      isWeekend,
      effectiveHours: 0,
      actualHours: 0,
      approvedHours: approvedOvertimeHours,
      status: 'NO_CLOCK_OUT',
      badgeText: 'Belum Pulang',
      weekdayHours: 0,
      weekendHours: 0
    }
  }

  let actualOvertimeHours = 0

  if (isWeekend) {
    // Lembur Weekend: dihitung murni dari total jam kerja (clock_in s/d clock_out)
    if (!clockIn) {
      return {
        isWeekend,
        effectiveHours: 0,
        actualHours: 0,
        approvedHours: approvedOvertimeHours,
        status: 'NO_CLOCK_OUT',
        badgeText: 'Belum Masuk',
        weekdayHours: 0,
        weekendHours: 0
      }
    }
    const diffMs = clockOut.getTime() - clockIn.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    actualOvertimeHours = diffMinutes >= 30 ? Math.round(diffMinutes / 60) : 0
    // Maksimal lembur weekend adalah 8 jam
    if (actualOvertimeHours > 8) actualOvertimeHours = 8
  } else {
    // Lembur Weekday: dihitung dari selisih kepulangan setelah pukul 17:00 WIB (+07:00)
    let dateStrWib: string
    if (typeof dateOrStr === 'string' && dateOrStr.length >= 10) {
      dateStrWib = dateOrStr.slice(0, 10)
    } else {
      dateStrWib = getDateStringWIB(clockOut)
    }
    const limit17 = new Date(`${dateStrWib}T17:00:00+07:00`)

    const diffMs = clockOut.getTime() - limit17.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    actualOvertimeHours = diffMinutes >= 30 ? Math.round(diffMinutes / 60) : 0
    // Maksimal lembur weekday adalah 3 jam
    if (actualOvertimeHours > 3) actualOvertimeHours = 3
  }

  if (actualOvertimeHours === 0) {
    return {
      isWeekend,
      effectiveHours: 0,
      actualHours: 0,
      approvedHours: approvedOvertimeHours,
      status: 'EARLY_LEAVE',
      badgeText: `ACC ${approvedOvertimeHours}j, Aktual 0j`,
      weekdayHours: 0,
      weekendHours: 0
    }
  }

  const effectiveHours = Math.min(actualOvertimeHours, approvedOvertimeHours)
  const resultStatus = actualOvertimeHours >= approvedOvertimeHours ? 'VALID' : 'EARLY_LEAVE'
  const badgeText = actualOvertimeHours >= approvedOvertimeHours 
    ? '✓ Sesuai ACC' 
    : `ACC ${approvedOvertimeHours}j, Aktual ${actualOvertimeHours}j`

  return {
    isWeekend,
    effectiveHours,
    actualHours: actualOvertimeHours,
    approvedHours: approvedOvertimeHours,
    status: resultStatus,
    badgeText,
    weekdayHours: isWeekend ? 0 : effectiveHours,
    weekendHours: isWeekend ? effectiveHours : 0
  }
}
