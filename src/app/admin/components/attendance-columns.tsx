"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatTimeWIB } from "@/lib/attendance-utils"

export type DashboardAttendance = {
  id: string
  clock_in: Date
  clock_out: Date | null
  duration_minutes: number | null
  status: string
  auto_checkout: boolean
  notes: string | null
  user: {
    full_name: string
    role: string
  }
}

export const attendanceColumns: ColumnDef<DashboardAttendance>[] = [
  {
    accessorKey: "user.full_name",
    header: "Nama Karyawan",
    cell: ({ row }) => (
      <div className="font-semibold text-slate-800">
        {row.original.user.full_name}
      </div>
    ),
  },
  {
    accessorKey: "user.role",
    header: "Peran (Role)",
    cell: ({ row }) => {
      const role = row.original.user.role
      const badgeClasses =
        role === "ADMIN"  ? "bg-purple-50 text-purple-700 border-purple-200" :
        role === "PM"     ? "bg-blue-50 text-blue-700 border-blue-200" :
        role === "MAGANG" ? "bg-amber-50 text-amber-700 border-amber-200" :
        "bg-slate-100 text-slate-700 border-slate-200"

      const roleLabel =
        role === "ADMIN"  ? "Admin" :
        role === "PM"     ? "Project Manager" :
        role === "MAGANG" ? "Magang" :
        "Engineer"

      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}>
          {roleLabel}
        </span>
      )
    },
  },
  {
    accessorKey: "clock_in",
    header: "Waktu Masuk",
    cell: ({ row }) => {
      if (row.original.status !== 'HADIR') {
        return <span className="text-slate-400 italic text-xs">-</span>
      }
      return (
        <span className="font-mono text-xs font-medium text-slate-700">
          {formatTimeWIB(row.original.clock_in)}
        </span>
      )
    },
  },
  {
    accessorKey: "clock_out",
    header: "Waktu Keluar",
    cell: ({ row }) => {
      const { status, clock_out, auto_checkout } = row.original

      if (status !== 'HADIR') {
        return <span className="text-slate-400 italic text-xs">-</span>
      }

      if (auto_checkout) {
        return (
          <span
            title="Karyawan tidak melakukan presensi pulang. Silakan admin verifikasi dan koreksi jika diperlukan."
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help whitespace-nowrap"
          >
            ⚠️ Lupa Checkout
          </span>
        )
      }

      if (!clock_out) {
        return <span className="text-slate-400 italic text-xs">Belum Keluar</span>
      }

      return (
        <span className="font-mono text-xs font-medium text-slate-700">
          {formatTimeWIB(clock_out)}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass =
        status === 'HADIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        status === 'SAKIT' ? 'bg-amber-50 text-amber-700 border-amber-200'    :
        status === 'IZIN'  ? 'bg-blue-50 text-blue-700 border-blue-200'       :
        'bg-rose-50 text-rose-700 border-rose-200'

      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "notes",
    header: "Catatan",
    cell: ({ row }) => {
      const { notes, auto_checkout } = row.original

      if (!notes && !auto_checkout) {
        return <span className="text-slate-300 text-xs">-</span>
      }

      if (auto_checkout && notes) {
        return (
          <div
            title={notes}
            className="flex items-center gap-1.5 max-w-[200px] cursor-help"
          >
            <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
            <span className="text-xs text-amber-700 font-medium truncate">
              Lupa presensi pulang — perlu koreksi
            </span>
          </div>
        )
      }

      return (
        <span className="text-xs text-slate-500 italic truncate max-w-[180px] block" title={notes ?? ''}>
          {notes}
        </span>
      )
    },
  },
]
