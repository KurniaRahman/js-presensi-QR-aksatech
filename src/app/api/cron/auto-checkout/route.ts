import { NextRequest, NextResponse } from "next/server"
import { runAutoCheckout } from "@/lib/auto-checkout"

/**
 * Vercel Cron Job endpoint: Auto-Checkout Tengah Malam WIB
 * Dijadwalkan tiap 00:00 WIB (17:00 UTC) via vercel.json
 *
 * Keamanan: Request hanya diterima jika header Authorization
 * cocok dengan CRON_SECRET yang diset di environment Vercel.
 */
export async function GET(request: NextRequest) {
  // Validasi keamanan via CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Di Vercel, cron job otomatis menyertakan header ini
  // Di development, bisa dilewati jika CRON_SECRET tidak diset
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  console.log("[CRON] Auto-checkout dimulai:", new Date().toISOString())

  const result = await runAutoCheckout()

  if (result.error) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Auto-checkout gagal",
        error: String(result.error)
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Auto-checkout selesai. ${result.updatedCount} record diperbarui.`,
    updatedCount: result.updatedCount,
    timestamp: new Date().toISOString()
  })
}
