import { LoginForm } from "./login-form"
import { ShieldCheck, Sparkles, Building2 } from "lucide-react"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-hidden">
      {/* Ornamen Ambient Background Khusus Mobile (Mencegah Layar Kosong & Polos) */}
      <div className="md:hidden absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#1F77C5]/12 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="md:hidden absolute top-96 -left-20 w-72 h-72 bg-gradient-to-tr from-sky-400/8 to-[#1F77C5]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="md:hidden absolute inset-0 bg-[radial-gradient(#1F77C512_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none -z-10 opacity-70"></div>

      {/* Left Side - Login Form (Lebar Penuh di Mobile, 50% di Desktop) */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-10 md:w-1/2 lg:px-20 xl:px-28 relative py-8 sm:py-12 md:py-8 min-h-screen">
        
        {/* Top Header Logo (Desktop: Absolute Top-8 / Mobile: In-Flow Header Beraksen) */}
        <div className="md:absolute md:top-8 md:left-8 flex items-center justify-between gap-3 mb-6 md:mb-0">
          <img
            src="/logo.png"
            alt="AksaTech Logo"
            className="object-contain h-10 sm:h-12 w-auto"
          />
          {/* Badge Khusus Mobile */}
          <span className="md:hidden px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-blue-50 text-[#1F77C5] border border-blue-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1F77C5] animate-pulse"></span>
            HRIS Mobile
          </span>
        </div>

        {/* Form Container (Di Mobile Diberi Card Pembungkus yang Proporsional & Modern) */}
        <div className="mx-auto w-full max-w-sm mt-2 sm:mt-4 md:mt-0 bg-white/90 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none p-6 sm:p-8 md:p-0 rounded-3xl md:rounded-none border border-slate-200/80 md:border-none shadow-xl shadow-blue-500/5 md:shadow-none animate-in fade-in duration-300">
          
          {/* Mobile Illustration Banner Card (Hadirkan Visual Desktop yang Mewah ke Layar Ponsel) */}
          <div className="md:hidden mb-6 relative rounded-2xl overflow-hidden border border-blue-100/90 shadow-md shadow-blue-500/10 aspect-[16/8] bg-gradient-to-br from-[#0B2545] to-[#1F77C5]">
            <img
              src="/background_login.png"
              alt="Aksa Tech Workspace"
              className="w-full h-full object-cover object-top opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-3">
            </div>
          </div>

          {/* Heading Teks Login */}
          <div className="mb-6 space-y-1.5">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#1F77C5] uppercase tracking-wider">
              Sistem Presensi Aksa Tech
            </h2>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              Masuk ke akun Anda untuk mencatat kehadiran dan mengelola aktivitas kerja.
            </p>
          </div>

          {/* Alert Jika Sesi Telah Habis */}
          {reason === "expired" && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start space-x-3 animate-in fade-in duration-200 shadow-2xs">
              <span className="text-amber-600 font-bold text-base leading-none mt-0.5">⏱️</span>
              <div className="space-y-0.5 text-left">
                <p className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                  Sesi Telah Berakhir
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Demi keamanan akun, sesi login dibatasi maksimal 2 jam. Silakan masuk kembali untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Form Interaktif */}
          <LoginForm />

          {/* Footer Security Badges Khusus Mobile */}
          <div className="md:hidden mt-8 pt-5 border-t border-slate-100 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Koneksi Aman </span>
            </div>
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} PT Aksa Tech. All rights reserved.
            </p>
          </div>
        </div>

        {/* Desktop Footer Credit */}
        <div className="hidden md:flex absolute bottom-8 left-8 lg:left-20 xl:left-28 items-center gap-3 text-xs text-slate-400 select-none">
          <p>© {new Date().getFullYear()} PT Aksa Tech. All rights reserved.</p>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Presensi Aman</span>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration (Tetap Penuh di Desktop seperti Semula) */}
      <div className="hidden w-1/2 bg-[#1F77C5] md:block relative">
        <img
          src="/background_login.png"
          alt="Login Illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
