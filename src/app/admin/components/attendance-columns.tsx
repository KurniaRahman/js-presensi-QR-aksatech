"use client"

import { ColumnDef } from "@tanstack/react-table"

export type DashboardAttendance = {
  id: string
  clock_in: Date
  clock_out: Date | null
  status: string
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
        role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" :
        role === "PM" ? "bg-blue-50 text-blue-700 border-blue-200" :
        "bg-slate-100 text-slate-700 border-slate-200"
      
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}>
          {role}
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
          {new Date(row.original.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      )
    },
  },
  {
    accessorKey: "clock_out",
    header: "Waktu Keluar",
    cell: ({ row }) => {
      if (row.original.status !== 'HADIR') {
        return <span className="text-slate-400 italic text-xs">-</span>
      }
      return row.original.clock_out 
        ? (
          <span className="font-mono text-xs font-medium text-slate-700">
            {new Date(row.original.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )
        : <span className="text-slate-400 italic text-xs">Belum Keluar</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass = 
        status === 'HADIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        status === 'SAKIT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        status === 'IZIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
        'bg-rose-50 text-rose-700 border-rose-200'
      
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
          {status}
        </span>
      )
    },
  },
]
