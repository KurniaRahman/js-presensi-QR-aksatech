import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { OvertimeForm } from "./components/overtime-form"
import { Clock, CheckCircle2, XCircle, Clock3 } from "lucide-react"

export default async function OvertimesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch overtime history for this user
  const overtimes = await db.overtime.findMany({
    where: {
      user_id: session.user.id
    },
    orderBy: {
      request_date: 'desc'
    },
    take: 10
  })

  return (
    <div className="min-h-full flex flex-col p-4 space-y-6 max-w-md md:max-w-5xl mx-auto md:p-8 pb-24 md:pb-8">
      <div className="flex items-center space-x-3 mb-2 md:mb-6">
        <div className="p-2 bg-blue-100 rounded-full">
          <Clock className="w-6 h-6 text-[#1F77C5]" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Pengajuan Lembur</h1>
          <p className="text-xs md:text-sm text-slate-500">Isi form untuk mengajukan lembur baru</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 lg:col-span-4">
          <OvertimeForm />
        </div>

        <div className="md:col-span-7 lg:col-span-8 space-y-4 mt-8 md:mt-0">
          <h2 className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-wider">
            Riwayat Lembur Terakhir
          </h2>

        {overtimes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500">Belum ada riwayat pengajuan lembur.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overtimes.map((ot) => (
              <div key={ot.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {ot.request_date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">
                      {ot.duration_hours} Jam
                    </p>
                  </div>
                  <div>
                    {ot.status === 'PENDING' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
                        <Clock3 className="w-3 h-3" />
                        <span>MENUNGGU</span>
                      </span>
                    )}
                    {ot.status === 'APPROVED' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DI SETUJUI</span>
                      </span>
                    )}
                    {ot.status === 'REJECTED' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>DI TOLAK</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-700">Alasan: </span>{ot.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
