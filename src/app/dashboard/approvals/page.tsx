import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { OvertimeApprovalBoard } from "@/components/overtime-approval-board"
import { Clock } from "lucide-react"

export default async function ApprovalsPage() {
  const session = await auth()
  
  if (!session || session.user.role !== "PM") {
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
    <div className="min-h-full flex flex-col p-4 space-y-6 max-w-md md:max-w-5xl mx-auto md:p-8 pb-24 md:pb-8">
      <div className="flex items-center space-x-3 mb-2 md:mb-6">
        <div className="p-2 bg-blue-100 rounded-full">
          <Clock className="w-6 h-6 text-[#1F77C5]" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Approval Lembur</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Kelola pengajuan lembur dari karyawan
          </p>
        </div>
      </div>

      <div className="w-full">
        <OvertimeApprovalBoard overtimes={overtimes} />
      </div>
    </div>
  )
}
