import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { OvertimeForm } from "./components/overtime-form"
import { UserOvertimeHistory } from "./components/user-overtime-history"
import { Clock } from "lucide-react"

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
          <UserOvertimeHistory overtimes={overtimes} />
        </div>
      </div>
    </div>
  )
}
