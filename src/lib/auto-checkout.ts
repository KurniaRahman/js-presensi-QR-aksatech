import { prisma as db } from "@/lib/prisma"

/**
 * Auto-checkout untuk semua karyawan yang lupa presensi pulang (clock_out null)
 * di hari sebelumnya. Dipanggil oleh Vercel Cron Job setiap jam 00:00 WIB (17:00 UTC).
 *
 * Yang dilakukan:
 * - Cari record attendance kemarin: status HADIR, clock_in ada, clock_out null
 * - Set clock_out ke 23:59:00 hari tersebut
 * - Hitung duration_minutes dari clock_in ke 23:59
 * - Set auto_checkout = true
 * - Set notes = keterangan untuk admin
 */
export async function runAutoCheckout(): Promise<{ updatedCount: number; error?: unknown }> {
  try {
    const now = new Date()

    // Hitung "kemarin" dalam zona waktu WIB (Asia/Jakarta)
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayStr = formatter.format(now)

    // Kemarin WIB
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = formatter.format(yesterdayDate)

    const yesterdayStart = new Date(`${yesterdayStr}T00:00:00.000Z`)
    const yesterdayEnd   = new Date(`${yesterdayStr}T23:59:59.999Z`)

    // Cari semua attendance kemarin yang sudah clock_in tapi belum clock_out
    const incomplete = await db.attendance.findMany({
      where: {
        record_date: { gte: yesterdayStart, lte: yesterdayEnd },
        status: 'HADIR',
        clock_in: { not: undefined },
        clock_out: null,
        auto_checkout: false, // Hindari proses ulang yang sudah di-auto-checkout
      },
      select: {
        id: true,
        clock_in: true,
        user: { select: { full_name: true } }
      }
    })

    if (incomplete.length === 0) {
      return { updatedCount: 0 }
    }

    // Biarkan clock_out dan duration_minutes tetap null sesuai kesepakatan:
    // Kolom jam keluar dibiarkan kosong (-) dengan badge merah "⚠️ Lupa Checkout"
    await Promise.all(
      incomplete.map(record => {
        return db.attendance.update({
          where: { id: record.id },
          data: {
            clock_out:        null,
            duration_minutes: null,
            auto_checkout:    true,
            notes:            `⚠️ Lupa Checkout: Karyawan (${record.user.full_name}) tidak melakukan presensi pulang pada ${yesterdayStr}. Silakan admin verifikasi dan koreksi jika diperlukan.`,
          }
        })
      })
    )

    console.log(`[AUTO-CHECKOUT] ${todayStr}: ${incomplete.length} record diupdate untuk tanggal ${yesterdayStr}.`)
    return { updatedCount: incomplete.length }

  } catch (error) {
    console.error("[AUTO-CHECKOUT] Gagal menjalankan auto-checkout:", error)
    return { updatedCount: 0, error }
  }
}
