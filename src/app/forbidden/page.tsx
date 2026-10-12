import Link from "next/link"
import Image from "next/image"
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react"

export default function ForbiddenPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-50/60 overflow-hidden font-sans">
      {/* Background Ornaments: Aerospace Dot-Grid & Ambient Blue Glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0B2545_1px,transparent_1px)] [background-size:24px_24px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#1F77C5]/12 blur-3xl" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl" 
        aria-hidden="true" 
      />

      {/* Orbital Radar Rings Decoration */}
      <div 
        className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full border border-blue-200/35" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -top-32 -right-32 w-[26rem] h-[26rem] rounded-full border border-blue-100/25" 
        aria-hidden="true" 
      />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden p-8 sm:p-10 text-center animate-fade-in">
        {/* Top Stripe Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />

        {/* Aksa Tech Logo */}
        <div className="flex justify-center mb-6">
          <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="PT Aksa Tech Logo"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* 403 Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-5 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badge & Heading */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200 mb-3">
          Error 403 • Akses Terbatas
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Akses Tidak Diizinkan
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Akun Anda tidak memiliki wewenang administratif untuk membuka modul atau halaman ini.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#103D6D] to-[#1F77C5] text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:from-[#0B2545] hover:to-[#155b99] transition-all transform active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-semibold text-sm border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <LogIn className="w-4 h-4 text-slate-400" />
            <span>Ganti Akun Lain</span>
          </Link>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-[11px] text-slate-400">
          PT Aksa Teknologi Nusantara • HRIS Security Gateway
        </p>
      </div>
    </div>
  )
}
