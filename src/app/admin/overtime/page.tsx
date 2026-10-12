import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { OvertimeApprovalBoard } from "@/components/overtime-approval-board"
import Link from "next/link"
import { Clock, ArrowLeft, Sparkles } from "lucide-react"

export default async function AdminOvertimePage() {
  const session = await auth()
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const overtimes = await db.overtime.findMany({
    include: {
      user: {
        select: {
          full_name: true,
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return (
    <div className="relative min-h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Ornamen Ambient Background & Aerospace Radar Rings */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#1F77C5]/12 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-96 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-sky-400/8 via-[#1F77C5]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Delicate Aerospace Orbital Radar Rings */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full border border-blue-200/35 pointer-events-none -z-10"></div>
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full border border-blue-100/25 pointer-events-none -z-10"></div>

      {/* Subtle Aerospace Tech Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F77C515_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 opacity-70"></div>

      {/* 1. Header Card Beraksen Biru Aksa Tech */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(31,119,197,0.08)] border border-blue-100/90 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Aksen Top Stripe Gradient Brand Aksa Tech */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400"></div>

        {/* Ornamen Grafis Lingkaran Halus */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-gradient-to-br from-blue-100/40 to-sky-50/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#1F77C5] text-white shadow-xs shadow-blue-500/20 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Administrator
            </span>
            <span className="text-xs text-blue-300 font-bold hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-[#1F77C5] bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100">
              Manajemen Lembur
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Manajemen <span className="bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-600 bg-clip-text text-transparent">Lembur</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-normal leading-relaxed">
            Kelola, setujui, tolak, atau pantau seluruh tiket pengajuan lembur karyawan dari seluruh departemen PT Aksa Tech.
          </p>
        </div>

        {/* Tombol Kembali ke Admin Dashboard */}
        <div className="relative z-10 flex-shrink-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#1F77C5] hover:border-[#1F77C5] hover:bg-blue-50/50 text-xs sm:text-sm font-bold shadow-2xs transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>

      {/* 2. Board Approval Lembur */}
      <div className="w-full">
        <OvertimeApprovalBoard overtimes={overtimes} />
      </div>

    </div>
  )
}
