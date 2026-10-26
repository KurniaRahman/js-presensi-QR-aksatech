import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserHistoryView } from "./components/user-history-view"
import { CalendarDays, ArrowLeft, History } from "lucide-react"

export const metadata = {
  title: "Riwayat Presensi | HRIS Aksa Tech",
  description: "Rekap data kehadiran dan jam kerja karyawan",
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const roleName = 
    session.user.role === 'ADMIN' ? 'Administrator' : 
    session.user.role === 'PM' ? 'Project Manager' : 
    session.user.role === 'MAGANG' ? 'Magang' : 
    'Engineer'

  return (
    <div className="relative min-h-screen bg-slate-50/60 font-sans">
      {/* Background Ornaments: Aerospace Dot-Grid & Ambient Blue Glow */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:radial-gradient(#0B2545_1px,transparent_1px)] [background-size:24px_24px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed -top-40 right-0 w-[32rem] h-[32rem] rounded-full bg-[#1F77C5]/12 blur-3xl" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed top-1/2 -left-32 w-96 h-96 rounded-full bg-sky-400/8 blur-3xl" 
        aria-hidden="true" 
      />

      {/* Orbital Radar Rings Decoration */}
      <div 
        className="pointer-events-none fixed -top-24 right-12 w-96 h-96 rounded-full border border-blue-200/35" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none fixed -top-40 right-0 w-[34rem] h-[34rem] rounded-full border border-blue-100/25" 
        aria-hidden="true" 
      />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-8">
        {/* Header Card */}
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 overflow-hidden">
          {/* Top Stripe Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1F77C5] border border-blue-200/60">
                  <History className="w-3.5 h-3.5" />
                  {roleName} • Presensi Karyawan 
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-[#1F77C5] border border-blue-100/80 shadow-sm">
                  <CalendarDays className="w-6 h-6" />
                </span>
                Riwayat & Rekap Presensi
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Pantau akumulasi kehadiran, jam kerja efektif harian, serta lembur yang telah tercatat dan disetujui.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-[#1F77C5] hover:border-blue-200 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User History View Component */}
        <UserHistoryView />
      </div>
    </div>
  )
}
