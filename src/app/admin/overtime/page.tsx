import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { OvertimeApprovalBoard } from "@/components/overtime-approval-board"
import { Clock } from "lucide-react"

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
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Clock className="w-6 h-6 text-[#1F77C5]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manajemen Lembur</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola dan pantau semua pengajuan lembur karyawan dari seluruh sistem.
          </p>
        </div>
      </div>

      <OvertimeApprovalBoard overtimes={overtimes} />
    </div>
  )
}
