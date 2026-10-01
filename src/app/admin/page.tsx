import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { attendanceColumns } from "./components/attendance-columns"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await auth()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)

  // Fetch Dashboard Stats
  const [totalUsers, pendingOvertimes, todayAttendances] = await Promise.all([
    db.user.count({ where: { is_active: true } }),
    db.overtime.count({ where: { status: 'PENDING' } }),
    db.attendance.count({ 
      where: { 
        record_date: { gte: todayStart, lte: todayEnd }
      } 
    })
  ])

  // Fetch Latest Attendances
  const recentAttendances = await db.attendance.findMany({
    where: {
      record_date: { gte: todayStart, lte: todayEnd }
    },
    include: {
      user: {
        select: { full_name: true, role: true }
      }
    },
    orderBy: {
      clock_in: 'desc'
    },
    take: 10
  })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">Selamat datang kembali, {session?.user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Karyawan Aktif</h3>
          <p className="text-3xl font-bold text-[#1F77C5] mt-2">{totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Lembur Menunggu Approval</h3>
          <p className="text-3xl font-bold text-amber-500 mt-2">{pendingOvertimes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Karyawan Hadir Hari Ini</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{todayAttendances}</p>
        </div>
      </div>

      {/* Real-time Attendances Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Data Presensi Terbaru (Hari Ini)</h2>
          <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
            Live Update
          </span>
        </div>
        <div className="p-4">
          <DataTable 
            columns={attendanceColumns} 
            data={recentAttendances} 
            searchPlaceholder="Cari presensi..."
          />
        </div>
      </div>
    </div>
  )
}
