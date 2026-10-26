"use client"

import { useState, useTransition } from "react"
import { getTeamActivityLogs } from "@/actions/activity-logs"
import { formatTimeWIB, formatDateWIB, getDateStringWIB } from "@/lib/attendance-utils"
import * as XLSX from "xlsx"
import {
  Users,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Loader2,
  ClipboardList,
  UserCheck,
  FileSpreadsheet,
  CalendarDays,
  Sparkles
} from "lucide-react"

export type TeamActivityItem = {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  log_date: Date | string
  created_at: Date | string
  user: {
    id: string
    full_name: string
    role: string
    email: string
  }
}

export type TeamMember = {
  id: string
  full_name: string
  role: string
  email: string
}

interface TeamActivityViewProps {
  initialLogs: TeamActivityItem[]
  teamMembers: TeamMember[]
  initialStartDate?: string
  initialEndDate?: string
  initialDate?: string
}

export function TeamActivityView({
  initialLogs,
  teamMembers,
  initialStartDate,
  initialEndDate,
  initialDate,
}: TeamActivityViewProps) {
  const todayStr = initialDate || getDateStringWIB(new Date())

  // Default range: 7 hari terakhir jika tidak disediakan
  const defaultStart = initialStartDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return getDateStringWIB(d)
  })()
  const defaultEnd = initialEndDate || todayStr

  const [logs, setLogs] = useState<TeamActivityItem[]>(initialLogs)
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activePreset, setActivePreset] = useState<string>("7days")
  const [selectedMember, setSelectedMember] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ----------------------------------------------------
  // PRESET & DATE RANGE HANDLERS
  // ----------------------------------------------------
  const applyPreset = (preset: "today" | "7days" | "30days" | "thisMonth") => {
    setActivePreset(preset)
    const now = new Date()
    const endStr = getDateStringWIB(now)
    let startStr = endStr

    if (preset === "today") {
      startStr = endStr
    } else if (preset === "7days") {
      const d = new Date()
      d.setDate(d.getDate() - 6)
      startStr = getDateStringWIB(d)
    } else if (preset === "30days") {
      const d = new Date()
      d.setDate(d.getDate() - 29)
      startStr = getDateStringWIB(d)
    } else if (preset === "thisMonth") {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, "0")
      startStr = `${y}-${m}-01`
    }

    setStartDate(startStr)
    setEndDate(endStr)
    fetchLogs(startStr, endStr, selectedMember)
  }

  const handleMemberChange = (memberId: string) => {
    setSelectedMember(memberId)
    fetchLogs(startDate, endDate, memberId)
  }

  const handleCustomRangeSearch = () => {
    setActivePreset("custom")
    fetchLogs(startDate, endDate, selectedMember)
  }

  const fetchLogs = (start: string, end: string, memberId: string) => {
    startTransition(async () => {
      const res = await getTeamActivityLogs(start, end, memberId)
      if (res.success && res.data) {
        setLogs(res.data as TeamActivityItem[])
      }
    })
  }

  // ----------------------------------------------------
  // EXPORT TO EXCEL (.xlsx)
  // ----------------------------------------------------
  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      const dataToExport = filteredLogs.map((item, index) => {
        const dateObj = typeof item.log_date === "string" ? new Date(item.log_date) : item.log_date
        const dateStr = formatDateWIB(dateObj, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        const statusLabel = 
          item.status === "DONE" ? "Selesai" : 
          item.status === "IN_PROGRESS" ? "Dalam Proses" : 
          "Pending"

        return {
          "No": index + 1,
          "Tanggal": dateStr,
          "Nama Engineer": item.user.full_name,
          "Email": item.user.email,
          "Judul Tugas": item.title,
          "Status": statusLabel,
          "Deskripsi Pekerjaan": item.description || "-",
          "Waktu Input (WIB)": formatTimeWIB(item.created_at),
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 26 },
        { wch: 28 },
        { wch: 35 },
        { wch: 15 },
        { wch: 50 },
        { wch: 18 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Aktivitas Tim")
      XLSX.writeFile(workbook, `Rekap_Aktivitas_Tim_${startDate}_to_${endDate}.xlsx`)
    } catch (err) {
      alert("Gagal mengunduh file Excel")
    } finally {
      setIsExporting(false)
    }
  }

  // ----------------------------------------------------
  // FILTERING & GROUPING LOGIC (OPTION 1)
  // ----------------------------------------------------
  const filteredLogs = logs.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      const matchName = item.user.full_name.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc && !matchName) return false
    }
    return true
  })

  // Group by date (descending)
  const groupedByDate = filteredLogs.reduce((acc, log) => {
    const rawDate = typeof log.log_date === "string" ? log.log_date.split("T")[0] : getDateStringWIB(log.log_date)
    if (!acc[rawDate]) {
      acc[rawDate] = []
    }
    acc[rawDate].push(log)
    return acc
  }, {} as Record<string, TeamActivityItem[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  // KPI Metrics (Calculated for current range)
  const totalCount = logs.length
  const doneCount = logs.filter((l) => l.status === "DONE").length
  const inProgressCount = logs.filter((l) => l.status === "IN_PROGRESS").length
  const pendingCount = logs.filter((l) => l.status === "PENDING").length
  const uniqueUsers = new Set(logs.map((l) => l.user_id)).size
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* 1. Control & Filter Bar (Fully Responsive) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-4">
        {/* Top Row: Presets, Range Pickers & Download Excel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Range & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
            {/* Range Inputs */}
            <div className="flex items-center space-x-1.5 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 bg-slate-50/70 w-full sm:w-auto justify-between sm:justify-start">
              <CalendarIcon className="w-4 h-4 text-[#1F77C5] shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer min-w-0 flex-1 sm:flex-initial sm:w-[125px]"
              />
              <span className="text-slate-400 font-bold shrink-0">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer min-w-0 flex-1 sm:flex-initial sm:w-[125px]"
              />
              <button
                type="button"
                onClick={handleCustomRangeSearch}
                className="ml-1 px-2.5 py-1 rounded-lg bg-[#1F77C5] text-white text-xs font-bold hover:bg-blue-600 transition-all shrink-0"
              >
                Cari
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "today", label: "Hari Ini" },
                { id: "7days", label: "7 Hari" },
                { id: "30days", label: "30 Hari" },
                { id: "thisMonth", label: "Bulan Ini" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    activePreset === p.id
                      ? "bg-[#1F77C5] text-white border-[#1F77C5] shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#1F77C5] font-medium animate-pulse ml-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memuat...
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Download Rekap Excel */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || filteredLogs.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              title="Unduh rekap file Excel dari log aktivitas tim"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? "Mengunduh Excel..." : "Download Rekap Excel Tim"}</span>
            </button>
          </div>
        </div>

        {/* Middle Row: Member Selector & Search Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Engineer Selector */}
          <div className="relative w-full sm:w-64">
            <select
              value={selectedMember}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 shadow-xs focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Engineer ({teamMembers.length})</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.role === "STAFF" ? "Engineer" : m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci tugas atau nama engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-700 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
            />
          </div>
        </div>

        {/* Bottom Row: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          {[
            { id: "ALL", label: "Semua", count: totalCount },
            { id: "DONE", label: "Selesai", count: doneCount },
            { id: "IN_PROGRESS", label: "Dalam Proses", count: inProgressCount },
            { id: "PENDING", label: "Pending", count: pendingCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-white text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Responsive KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tasks */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tugas Tim
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{totalCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{startDate} s/d {endDate}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Completed Tasks */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/70 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Tugas Selesai
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{doneCount}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                {completionRate}% Completion Rate
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: In Progress Tasks */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Dalam Proses
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{inProgressCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sedang dikerjakan engineer</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Engineers Reporting */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Engineer Terlibat
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{uniqueUsers}</h3>
            <p className="text-xs text-slate-500 mt-0.5">dari {teamMembers.length} engineer aktif</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Grouped Chronological Timeline (Option 1 Core) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1F77C5]" />
            Timeline Aktivitas Tim
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredLogs.length} Tugas
            </span>
          </h2>
        </div>

        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-slate-300 space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 mx-auto flex items-center justify-center shadow-xs">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">Tidak Ada Catatan Aktivitas</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Belum ada log aktivitas engineer yang ditemukan untuk rentang waktu{" "}
                <span className="font-semibold text-slate-700">{startDate}</span> s/d{" "}
                <span className="font-semibold text-slate-700">{endDate}</span>
                {selectedMember !== "ALL" ? " untuk engineer yang dipilih." : "."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => {
              const logsForDate = groupedByDate[dateKey]
              const doneCount = logsForDate.filter((l) => l.status === "DONE").length
              const isDateToday = dateKey === todayStr

              return (
                <div
                  key={dateKey}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-blue-200"
                >
                  {/* Date Header Strip */}
                  <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CalendarIcon className="w-4 h-4 text-[#1F77C5]" />
                      <span className="text-sm font-bold text-slate-800">
                        {formatDateWIB(dateKey, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {isDateToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F77C5] text-white shadow-xs">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-start sm:self-center">
                      <span>{logsForDate.length} Tugas</span>
                      <span>•</span>
                      <span className="text-emerald-600">{doneCount} Selesai</span>
                    </div>
                  </div>

                  {/* Tasks on this date */}
                  <div className="divide-y divide-slate-100 p-2 sm:p-4">
                    {logsForDate.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Engineer Name Badge */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1F77C5] border border-blue-200/70 shrink-0">
                              <span className="w-4 h-4 rounded-full bg-[#1F77C5] text-white text-[9px] flex items-center justify-center font-bold">
                                {getInitials(item.user.full_name)}
                              </span>
                              <span>{item.user.full_name}</span>
                            </span>

                            {/* Status Badge */}
                            {item.status === "DONE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Selesai
                              </span>
                            )}
                            {item.status === "IN_PROGRESS" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Dalam Proses
                              </span>
                            )}
                            {item.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                <AlertCircle className="w-3 h-3 text-slate-500" />
                                Pending
                              </span>
                            )}

                            <h4 className="text-sm font-bold text-slate-800 break-words">{item.title}</h4>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-1 break-words">
                            {item.description || <span className="italic text-slate-400">Tidak ada deskripsi.</span>}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1 pt-0.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>Diinput pukul {formatTimeWIB(item.created_at)} WIB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
