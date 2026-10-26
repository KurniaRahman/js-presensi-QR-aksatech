"use client"

import { useState, useTransition } from "react"
import { 
  createActivityLog, 
  updateActivityLog, 
  deleteActivityLog,
  getActivityLogs
} from "@/actions/activity-logs"
import { formatTimeWIB, formatDateWIB, getDateStringWIB } from "@/lib/attendance-utils"
import * as XLSX from "xlsx"
import { 
  ClipboardList, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  Loader2, 
  FileSpreadsheet,
  Search,
  Filter,
  Sparkles,
  CalendarDays
} from "lucide-react"

export type ActivityItem = {
  id: string
  title: string
  description: string
  status: string
  log_date: Date | string
  created_at: Date | string
}

interface ActivityLogViewProps {
  initialLogs: ActivityItem[]
  initialStartDate?: string
  initialEndDate?: string
  initialDate?: string
}

export function ActivityLogView({ 
  initialLogs, 
  initialStartDate,
  initialEndDate,
  initialDate 
}: ActivityLogViewProps) {
  const todayStr = initialDate || getDateStringWIB(new Date())

  // Default range: 7 hari terakhir jika tidak disediakan
  const defaultStart = initialStartDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return getDateStringWIB(d)
  })()
  const defaultEnd = initialEndDate || todayStr

  // State
  const [logs, setLogs] = useState<ActivityItem[]>(initialLogs)
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activePreset, setActivePreset] = useState<string>("7days")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isExporting, setIsExporting] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Modal State Tambah / Edit Tugas
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ActivityItem | null>(null)
  const [targetDate, setTargetDate] = useState(todayStr)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("DONE")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal State Hapus Tugas (Pop-up Konfirmasi)
  const [itemToDelete, setItemToDelete] = useState<ActivityItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    fetchLogs(startStr, endStr)
  }

  const handleCustomRangeSearch = () => {
    setActivePreset("custom")
    fetchLogs(startDate, endDate)
  }

  const fetchLogs = (start: string, end: string) => {
    startTransition(async () => {
      const res = await getActivityLogs(start, end)
      if (res.success && res.data) {
        setLogs(res.data)
      }
    })
  }

  // ----------------------------------------------------
  // MODAL HANDLERS
  // ----------------------------------------------------
  const openAddModal = () => {
    setEditTarget(null)
    setTargetDate(todayStr)
    setTitle("")
    setDescription("")
    setStatus("DONE")
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: ActivityItem) => {
    setEditTarget(item)
    const itemDate = typeof item.log_date === "string" 
      ? item.log_date.split("T")[0] 
      : getDateStringWIB(item.log_date)
    setTargetDate(itemDate)
    setTitle(item.title)
    setDescription(item.description)
    setStatus(item.status)
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Judul tugas wajib diisi")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (editTarget) {
        const res = await updateActivityLog(editTarget.id, {
          title,
          description,
          status,
        })
        if (res.success && res.data) {
          setLogs(prev => prev.map(l => l.id === editTarget.id ? res.data : l))
          setIsModalOpen(false)
        }
      } else {
        const res = await createActivityLog({
          title,
          description,
          status,
          dateStr: targetDate,
        })
        if (res.success && res.data) {
          setLogs(prev => [res.data, ...prev])
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data aktivitas")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (item: ActivityItem) => {
    setItemToDelete(item)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await deleteActivityLog(itemToDelete.id)
      if (res.success) {
        setLogs(prev => prev.filter(l => l.id !== itemToDelete.id))
        setItemToDelete(null)
      } else {
        setDeleteError("Gagal menghapus catatan aktivitas")
      }
    } catch (err: any) {
      setDeleteError(err.message || "Gagal menghapus catatan aktivitas")
    } finally {
      setIsDeleting(false)
    }
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
        { wch: 35 },
        { wch: 15 },
        { wch: 50 },
        { wch: 18 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Aktivitas")
      XLSX.writeFile(workbook, `Log_Aktivitas_Engineer_${startDate}_to_${endDate}.xlsx`)
    } catch (err) {
      alert("Gagal mengunduh file Excel")
    } finally {
      setIsExporting(false)
    }
  }

  // ----------------------------------------------------
  // FILTERING & GROUPING LOGIC (OPTION 1)
  // ----------------------------------------------------
  const filteredLogs = logs.filter(item => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
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
  }, {} as Record<string, ActivityItem[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  // KPI Metrics (Calculated for current range)
  const totalCount = logs.length
  const doneCount = logs.filter(l => l.status === "DONE").length
  const inProgressCount = logs.filter(l => l.status === "IN_PROGRESS").length
  const pendingCount = logs.filter(l => l.status === "PENDING").length
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* 1. Control & Filter Bar (Fully Responsive) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-4">
        {/* Top Row: Presets, Range Picker & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Range & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
            {/* Range Pickers */}
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

          {/* Action Buttons: Add Task & Export Excel */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || filteredLogs.length === 0}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs hover:bg-emerald-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
              title="Unduh file Excel dari tugas yang difilter"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExporting ? "Mengunduh..." : "Ekspor Excel"}</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#1F77C5] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all active:scale-[0.98] flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Status Filter Badges & Search Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
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

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-700 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Responsive KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tasks Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tugas Periode
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{totalCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{startDate} s/d {endDate}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tasks Card */}
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

        {/* In Progress Tasks Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Dalam Proses
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{inProgressCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingCount > 0 ? `${pendingCount} tugas pending` : "Sedang dikerjakan"}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Grouped Chronological Timeline (Option 1 Core) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1F77C5]" />
            Timeline Riwayat Pekerjaan
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
                Belum ada tugas yang ditemukan dalam rentang tanggal{" "}
                <span className="font-semibold text-slate-700">{startDate}</span> s/d{" "}
                <span className="font-semibold text-slate-700">{endDate}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => {
              const logsForDate = groupedByDate[dateKey]
              const doneCount = logsForDate.filter(l => l.status === "DONE").length
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
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-all group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.status === "DONE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Selesai
                              </span>
                            )}
                            {item.status === "IN_PROGRESS" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Dalam Proses
                              </span>
                            )}
                            {item.status === "PENDING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                                Pending
                              </span>
                            )}

                            <h3 className="text-sm font-bold text-slate-800 break-words">{item.title}</h3>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-1 break-words">
                            {item.description || <span className="italic text-slate-400">Tidak ada deskripsi rincian.</span>}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1 pt-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>Diinput pukul {formatTimeWIB(item.created_at)} WIB</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F77C5] hover:bg-blue-50 transition-all"
                            title="Edit Tugas"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* 4. Modal Tambah / Edit Tugas (Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 sm:space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1F77C5]" />
                {editTarget ? "Edit Catatan Pekerjaan" : "Tambah Pekerjaan Harian"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tanggal Pekerjaan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tanggal Pekerjaan *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  required
                />
              </div>

              {/* Judul Tugas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Judul Tugas / Pekerjaan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kalibrasi sensor telemetry TR6066"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  required
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status Pengerjaan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "DONE", label: "Selesai", icon: CheckCircle2, color: "text-emerald-600 border-emerald-200 bg-emerald-50" },
                    { id: "IN_PROGRESS", label: "Dalam Proses", icon: Clock, color: "text-amber-600 border-amber-200 bg-amber-50" },
                    { id: "PENDING", label: "Pending", icon: AlertCircle, color: "text-slate-600 border-slate-200 bg-slate-50" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id)}
                      className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        status === st.id
                          ? `${st.color} shadow-xs ring-2 ring-[#1F77C5]/20`
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <st.icon className="w-4 h-4 mb-1" />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rincian Deskripsi
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan kendala, progres, atau dokumentasi spesifikasi pekerjaan teknis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editTarget ? "Simpan Perubahan" : "Tambah Tugas"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Hapus Tugas (Modern Responsive Pop-up) */}
      {itemToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setItemToDelete(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative overflow-hidden">
            {/* Accent Red Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Hapus Catatan Aktivitas?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan tugas{" "}
                  <span className="font-semibold text-slate-800 break-words">
                    "{itemToDelete.title}"
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-2 bg-rose-50/80 px-3 py-2 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Tindakan ini bersifat permanen dan data tugas tidak dapat dipulihkan.</span>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
