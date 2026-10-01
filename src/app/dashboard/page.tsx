import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)

  const todayAttendance = await db.attendance.findFirst({
    where: {
      user_id: session.user.id,
      record_date: {
        gte: todayStart,
        lte: todayEnd,
      }
    }
  })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Karyawan</h1>
        <p className="text-gray-600 mt-1">
          Halo, <span className="font-semibold text-[#1F77C5]">{session.user.name}</span>! Selamat Datang.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Status Kehadiran Hari Ini</h3>
          {!todayAttendance ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                <span className="text-yellow-600">Belum Absen</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Silakan lakukan Scan QR untuk Clock-in.</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                <span className="text-green-600">{todayAttendance.status}</span>
              </p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>Clock-in: <span className="font-medium">{todayAttendance.clock_in.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></p>
                <p>Clock-out: <span className="font-medium">{todayAttendance.clock_out ? todayAttendance.clock_out.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span></p>
                {todayAttendance.duration_minutes !== null && (
                  <p>Durasi: <span className="font-medium">{todayAttendance.duration_minutes} Menit</span></p>
                )}
              </div>
            </>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Jam Lembur Bulan Ini</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0 Jam</p>
          <p className="text-xs text-gray-400 mt-1">Belum ada lembur yang disetujui.</p>
        </div>
      </div>
    </div>
  )
}
