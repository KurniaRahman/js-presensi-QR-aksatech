"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { attendanceColumns, DashboardAttendance } from "./attendance-columns"
import { Compass, CheckCircle2, Clock, Users, Filter, RotateCcw } from "lucide-react"

type UnattendedUser = {
  id: string
  full_name: string
  role: string
  email?: string
  status?: string
}

type Props = {
  attendedRecords: DashboardAttendance[]
  unattendedUsers: UnattendedUser[]
  totalEmployees: number
  dateFormatted: string
}

type FilterTab = "ALL" | "ATTENDED" | "UNATTENDED"

export function RealtimeAttendanceBoard({
  attendedRecords,
  unattendedUsers,
  totalEmployees,
  dateFormatted,
}: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")
  const [roleFilter, setRoleFilter] = useState("ALL")

  // Convert unattended users into DashboardAttendance format
  const unattendedRecords = useMemo<DashboardAttendance[]>(() => {
    return unattendedUsers.map((user) => ({
      id: `unattended_${user.id}`,
      clock_in: null,
      clock_out: null,
      duration_minutes: null,
      status: user.status || "BELUM_HADIR",
      auto_checkout: false,
      notes: user.status === "ALPHA" ? "Tidak hadir tanpa keterangan (Alpha)" : "Belum melakukan presensi hari ini",
      user: {
        full_name: user.full_name,
        role: user.role,
      },
    }))
  }, [unattendedUsers])

  const attendedCount = attendedRecords.length
  const unattendedCount = unattendedUsers.length
  const totalCount = totalEmployees || (attendedCount + unattendedCount)
  const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0

  // Combine both lists for the ALL view
  const allRecords = useMemo<DashboardAttendance[]>(() => {
    return [...attendedRecords, ...unattendedRecords]
  }, [attendedRecords, unattendedRecords])

  // Filter based on active tab and role
  const displayData = useMemo(() => {
    let list: DashboardAttendance[] = []

    if (activeTab === "ATTENDED") {
      list = attendedRecords
    } else if (activeTab === "UNATTENDED") {
      list = unattendedRecords
    } else {
      list = allRecords
    }

    if (roleFilter !== "ALL") {
      list = list.filter((r) => r.user.role === roleFilter)
    }

    return list
  }, [activeTab, roleFilter, attendedRecords, unattendedRecords, allRecords])

  const filterControls = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center space-x-1.5">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#1F77C5] cursor-pointer font-medium"
        >
          <option value="ALL">Semua Jabatan</option>
          <option value="ADMIN">Admin</option>
          <option value="PM">Project Manager</option>
          <option value="STAFF">Engineer</option>
          <option value="MAGANG">Magang</option>
        </select>
      </div>

      {roleFilter !== "ALL" && (
        <button
          onClick={() => setRoleFilter("ALL")}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl transition-colors font-medium"
          title="Reset Filter Jabatan"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_25px_-5px_rgba(31,119,197,0.06)] border border-slate-200/90 overflow-hidden relative">
      {/* Top Accent Stripe Brand Aksa */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />

      {/* Header Info & Progress Metric */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-200/80 flex items-center justify-center shadow-2xs flex-shrink-0">
            <Compass className="w-5 h-5 text-[#1F77C5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Data Presensi Hari Ini (Real-Time)
              </h2>
              {/* Badge Rasio Kehadiran */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#1F77C5]/10 text-[#1F77C5] border border-[#1F77C5]/20">
                {attendedCount}/{totalCount} ({attendancePercentage}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dateFormatted} • {unattendedCount > 0 ? `${unattendedCount} karyawan belum presensi masuk` : "Seluruh karyawan telah presensi"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {/* Visual Progress Kehadiran */}
          <div className="hidden sm:flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kehadiran</p>
              <p className="text-xs font-extrabold text-slate-700">{attendedCount} dari {totalCount} Karyawan</p>
            </div>
            <div className="w-20 lg:w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#103D6D] to-[#1F77C5] rounded-full transition-all duration-500"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <span className="text-xs font-black text-[#1F77C5]">{attendancePercentage}%</span>
          </div>

          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitoring
          </span>
        </div>
      </div>

      {/* Tab Switcher: Semua, Sudah Presensi, Belum Presensi */}
      <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-[#1F77C5] text-white border-[#1F77C5] shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Semua Karyawan ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTENDED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeTab === "ATTENDED"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Presensi ({attendedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UNATTENDED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              activeTab === "UNATTENDED"
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Belum Presensi ({unattendedCount})</span>
          </button>
        </div>

        {/* Info ringkas tab aktif */}
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800">{displayData.length}</span> data
        </div>
      </div>

      {/* Table Section */}
      <div className="p-4 sm:p-6">
        <DataTable
          columns={attendanceColumns}
          data={displayData}
          searchPlaceholder="Cari presensi atau nama karyawan..."
          filterControls={filterControls}
        />
      </div>
    </div>
  )
}
