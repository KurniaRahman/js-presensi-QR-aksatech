import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { DigitalClock } from "./components/digital-clock"
import Link from "next/link"
import { ScanLine, LogIn, LogOut } from "lucide-react"
import { LogoutButton } from "./components/logout-button"

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

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthOvertimes = await db.overtime.findMany({
    where: {
      user_id: session.user.id,
      request_date: {
        gte: firstDayOfMonth,
      },
      status: 'APPROVED'
    }
  })
  const totalOvertimeHours = currentMonthOvertimes.reduce((sum, ot) => sum + ot.duration_hours, 0)

  return (
    <div className="min-h-full flex flex-col items-center p-4 max-w-md md:max-w-4xl mx-auto relative md:justify-center">
      <div className="absolute top-4 right-4 md:hidden">
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full md:mt-12">
        {/* Kolom Kiri: Sapaan, Jam, Tombol Scan */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-2 w-full mt-6 md:mt-0">
            <div>
              <p className="text-sm md:text-base text-slate-500 font-medium">
                Halo, <span className="font-bold text-[#1F77C5]">{session.user.name}</span>
              </p>
            </div>

            <DigitalClock />
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            {/* Huge Scan Button */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-100 rounded-full animate-pulse opacity-50"></div>
              <Link 
                href="/dashboard/scan" 
                className="relative flex flex-col items-center justify-center w-40 h-40 md:w-48 md:h-48 bg-[#1F77C5] hover:bg-[#155b99] transition-all rounded-full shadow-[0_10px_40px_rgba(31,119,197,0.4)] text-white hover:scale-105 active:scale-95"
              >
                <ScanLine className="w-12 h-12 md:w-16 md:h-16 mb-1 md:mb-2" />
                <span className="text-lg md:text-xl font-bold tracking-wide">Scan Absen</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Stats Absensi & Lembur */}
        <div className="flex flex-col justify-center space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
            <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="h-8 w-8 md:h-12 md:w-12 bg-green-50 rounded-full flex items-center justify-center mb-2 md:mb-4">
                <LogIn className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5 md:mb-1">Jam Masuk</p>
              <p className="text-base md:text-xl font-bold text-slate-900">
                {todayAttendance?.clock_in ? todayAttendance.clock_in.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>

            <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="h-8 w-8 md:h-12 md:w-12 bg-amber-50 rounded-full flex items-center justify-center mb-2 md:mb-4">
                <LogOut className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5 md:mb-1">Jam Keluar</p>
              <p className="text-base md:text-xl font-bold text-slate-900">
                {todayAttendance?.clock_out ? todayAttendance.clock_out.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
          </div>

          {todayAttendance?.duration_minutes && (
            <div className="w-full text-center py-2 px-3 md:py-4 md:px-5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs md:text-sm text-slate-600">
                Total Jam Kerja: <strong className="text-slate-900 md:text-lg ml-1">{Math.floor(todayAttendance.duration_minutes / 60)}j {todayAttendance.duration_minutes % 60}m</strong>
              </p>
            </div>
          )}

          <div className="w-full bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-0.5 md:mb-2">
              <h3 className="text-slate-500 text-xs md:text-sm font-medium">Total Jam Lembur Bulan Ini</h3>
            </div>
            <p className="text-2xl md:text-4xl font-bold text-slate-900">{totalOvertimeHours} <span className="text-sm md:text-lg font-medium text-slate-500">Jam</span></p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1 md:mt-2">
              {totalOvertimeHours > 0 ? `${currentMonthOvertimes.length} pengajuan telah disetujui.` : 'Belum ada lembur yang disetujui.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
