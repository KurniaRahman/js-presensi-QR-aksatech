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
    cell: ({ row }) => <div className="font-medium">{row.original.user.full_name}</div>,
  },
  {
    accessorKey: "user.role",
    header: "Role",
    cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.user.role}</span>,
  },
  {
    accessorKey: "clock_in",
    header: "Waktu Masuk",
    cell: ({ row }) => {
      return new Date(row.original.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    },
  },
  {
    accessorKey: "clock_out",
    header: "Waktu Keluar",
    cell: ({ row }) => {
      return row.original.clock_out 
        ? new Date(row.original.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : <span className="text-gray-400 italic">Belum Keluar</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass = 
        status === 'HADIR' ? 'bg-green-100 text-green-800' :
        status === 'SAKIT' ? 'bg-yellow-100 text-yellow-800' :
        status === 'IZIN' ? 'bg-blue-100 text-blue-800' :
        'bg-red-100 text-red-800'
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
          {status}
        </span>
      )
    },
  },
]
