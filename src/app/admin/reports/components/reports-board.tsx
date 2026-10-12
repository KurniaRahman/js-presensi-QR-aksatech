"use client"

import { useState, useEffect, useMemo } from "react"
import { getDailyRecords, getReportData, saveDailyRecord, deleteAttendanceRecord } from "@/actions/admin-attendance"
import { calculateEffectiveOvertime, isWeekendDay } from "@/lib/attendance-utils"
import { Search, Download, Plus, Calendar as CalendarIcon, X, Edit2, Trash2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Filter, RotateCcw } from "lucide-react"
import * as XLSX from "xlsx"

type StaffUser = { id: string; full_name: string; role?: string }
type DailyRecord = {
  id: string;
  user_id: string;
  user_name: string;
  user_role?: string;
  dateStr: string;
  date: Date;
  attendance: { id?: string, status: string, clock_in: Date, clock_out: Date | null } | null;
  overtime: { id: string, duration_hours: number, status: string } | null;
}

export function ReportsBoard({ staffUsers }: { staffUsers: StaffUser[] }) {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  })
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  type SortCol = "date" | "name" | "status" | "clockIn" | "clockOut" | "otWeekday" | "otWeekend"
  const [sortCol, setSortCol] = useState<SortCol>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    userId: "",
    recordDate: new Date().toISOString().split('T')[0],
    attendanceStatus: "HADIR" as "HADIR" | "SAKIT" | "IZIN" | "ALPHA" | "",
    clockIn: "08:00",
    clockOut: "17:00"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedRecordOvertime, setSelectedRecordOvertime] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; dateStr: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getDailyRecords(startDate, endDate)
      setRecords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir(col === "date" ? "desc" : "asc")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
  }

  const processedRecords = useMemo(() => {
    let list = records.filter(r => {
      if (searchQuery && !r.user_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (statusFilter !== "ALL") {
        if (!r.attendance || r.attendance.status !== statusFilter) return false
      }
      return true
    })

    list.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortCol) {
        case "date":
          valA = new Date(a.dateStr || a.date).getTime()
          valB = new Date(b.dateStr || b.date).getTime()
          break
        case "name":
          valA = a.user_name.toLowerCase()
          valB = b.user_name.toLowerCase()
          break
        case "status":
          valA = a.attendance?.status || ""
          valB = b.attendance?.status || ""
          break
        case "clockIn":
          valA = a.attendance?.clock_in ? new Date(a.attendance.clock_in).getTime() : 0
          valB = b.attendance?.clock_in ? new Date(b.attendance.clock_in).getTime() : 0
          break
        case "clockOut":
          valA = a.attendance?.clock_out ? new Date(a.attendance.clock_out).getTime() : 0
          valB = b.attendance?.clock_out ? new Date(b.attendance.clock_out).getTime() : 0
          break
        case "otWeekday": {
          const appA = a.overtime?.status === 'APPROVED' ? a.overtime.duration_hours : 0
          const effA = calculateEffectiveOvertime(a.dateStr || a.date, a.attendance?.clock_in ? new Date(a.attendance.clock_in) : null, a.attendance?.clock_out ? new Date(a.attendance.clock_out) : null, appA)
          valA = !effA.isWeekend ? effA.effectiveHours : -1

          const appB = b.overtime?.status === 'APPROVED' ? b.overtime.duration_hours : 0
          const effB = calculateEffectiveOvertime(b.dateStr || b.date, b.attendance?.clock_in ? new Date(b.attendance.clock_in) : null, b.attendance?.clock_out ? new Date(b.attendance.clock_out) : null, appB)
          valB = !effB.isWeekend ? effB.effectiveHours : -1
          break
        }
        case "otWeekend": {
          const appA = a.overtime?.status === 'APPROVED' ? a.overtime.duration_hours : 0
          const effA = calculateEffectiveOvertime(a.dateStr || a.date, a.attendance?.clock_in ? new Date(a.attendance.clock_in) : null, a.attendance?.clock_out ? new Date(a.attendance.clock_out) : null, appA)
          valA = effA.isWeekend ? effA.effectiveHours : -1

          const appB = b.overtime?.status === 'APPROVED' ? b.overtime.duration_hours : 0
          const effB = calculateEffectiveOvertime(b.dateStr || b.date, b.attendance?.clock_in ? new Date(b.attendance.clock_in) : null, b.attendance?.clock_out ? new Date(b.attendance.clock_out) : null, appB)
          valB = effB.isWeekend ? effB.effectiveHours : -1
          break
        }
        default:
          valA = 0
          valB = 0
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1
      if (valA > valB) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return list
  }, [records, searchQuery, statusFilter, sortCol, sortDir])

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 inline-block ml-1" />
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    )
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const reportData = await getReportData(startDate, endDate)
      
      const worksheet = XLSX.utils.json_to_sheet(reportData.map(r => ({
        "Nama Lengkap": r.nama,
        "Jabatan": r.jabatan,
        "Jumlah Hadir": r.jumlahHadir,
        "Total Jam Kerja": r.totalJamKerja,
        "Lembur Weekday (Jam)": r.lemburWeekday,
        "Lembur Weekend (Jam)": r.lemburWeekend
      })))

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Absensi")
      
      XLSX.writeFile(workbook, `Laporan_Absensi_${startDate}_to_${endDate}.xlsx`)
    } catch (err) {
      alert("Gagal mengexport data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (record: DailyRecord) => {
    setEditMode(true)
    let cIn = "08:00"
    let cOut = "17:00"
    
    if (record.attendance) {
      const cInDate = new Date(record.attendance.clock_in)
      cIn = `${cInDate.getHours().toString().padStart(2, '0')}:${cInDate.getMinutes().toString().padStart(2, '0')}`
      if (record.attendance.clock_out) {
        const cOutDate = new Date(record.attendance.clock_out)
        cOut = `${cOutDate.getHours().toString().padStart(2, '0')}:${cOutDate.getMinutes().toString().padStart(2, '0')}`
      } else {
        cOut = ""
      }
    }

    setSelectedRecordOvertime(record.overtime?.status === 'APPROVED' ? record.overtime.duration_hours : null)
    setFormData({
      userId: record.user_id,
      recordDate: record.dateStr || new Date(record.date).toISOString().split('T')[0],
      attendanceStatus: record.attendance?.status as any || "HADIR",
      clockIn: cIn,
      clockOut: cOut
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setEditMode(false)
    setSelectedRecordOvertime(null)
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setFormData({
      userId: "",
      recordDate: `${y}-${m}-${d}`,
      attendanceStatus: "HADIR",
      clockIn: "08:00",
      clockOut: "17:00"
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId) return alert("Pilih karyawan")

    setIsSubmitting(true)
    try {
      await saveDailyRecord({
        userId: formData.userId,
        recordDate: formData.recordDate,
        attendanceStatus: formData.attendanceStatus,
        clockIn: formData.clockIn || null,
        clockOut: formData.clockOut || null
      })
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      alert("Gagal menyimpan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteAttendanceRecord(deleteTarget.id)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      alert("Gagal menghapus data presensi")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
          <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-slate-700 font-medium"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-slate-700 font-medium"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#1F77C5] transition-all bg-white"
            />
          </div>
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#1F77C5] cursor-pointer font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir Saja</option>
              <option value="SAKIT">Sakit Saja</option>
              <option value="IZIN">Izin Saja</option>
              <option value="ALPHA">Alpha Saja</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl transition-colors font-medium"
              title="Reset Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-xs bg-blue-50 text-[#1F77C5] font-semibold px-2.5 py-1 rounded-full border border-blue-100 self-center">
            {processedRecords.length} Total
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-[#1F77C5] hover:bg-[#1a64a6] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Manual</span>
          </button>
          <button 
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th 
                  onClick={() => handleSort("date")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Tanggal</span>
                    <SortIcon col="date" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("name")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Nama Karyawan</span>
                    <SortIcon col="name" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("status")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Status</span>
                    <SortIcon col="status" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("clockIn")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Jam Masuk</span>
                    <SortIcon col="clockIn" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("clockOut")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Jam Keluar</span>
                    <SortIcon col="clockOut" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("otWeekday")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>Lembur Weekday</span>
                    <SortIcon col="otWeekday" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("otWeekend")}
                  className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>Lembur Weekend</span>
                    <SortIcon col="otWeekend" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && processedRecords.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Memuat data...</td></tr>
              ) : processedRecords.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Tidak ada data di rentang waktu ini.</td></tr>
              ) : (
                processedRecords.map((record) => {
                  const approvedOt = record.overtime?.status === 'APPROVED' ? record.overtime.duration_hours : 0
                  const clockInDt = record.attendance?.clock_in ? new Date(record.attendance.clock_in) : null
                  const clockOutDt = record.attendance?.clock_out ? new Date(record.attendance.clock_out) : null
                  const effective = calculateEffectiveOvertime(record.dateStr || record.date, clockInDt, clockOutDt, approvedOt)

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {new Date((record.dateStr || record.date) + "T00:00:00").toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{record.user_name}</span>
                          {record.user_role && record.user_role !== 'STAFF' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              record.user_role === 'ADMIN' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {record.user_role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.attendance ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            record.attendance.status === 'HADIR' ? 'bg-green-50 text-green-600' : 
                            record.attendance.status === 'SAKIT' ? 'bg-amber-50 text-amber-600' : 
                            record.attendance.status === 'IZIN' ? 'bg-blue-50 text-blue-600' : 
                            'bg-red-50 text-red-600'
                          }`}>
                            {record.attendance.status}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.attendance && record.attendance.status === 'HADIR' ? new Date(record.attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {record.attendance?.clock_out && record.attendance.status === 'HADIR' ? new Date(record.attendance.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                      </td>
                      {/* Lembur Weekday */}
                      <td className="px-4 py-3 text-center">
                        {!effective.isWeekend ? (
                          effective.effectiveHours > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-slate-800 text-sm">{effective.effectiveHours} Jam</span>
                              {effective.status === 'VALID' ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Sesuai ACC
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {effective.badgeText}
                                </span>
                              )}
                            </div>
                          ) : approvedOt > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-400 font-medium text-sm">0 Jam</span>
                              {effective.status === 'NO_CLOCK_OUT' ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  Belum Pulang
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {effective.badgeText}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      {/* Lembur Weekend */}
                      <td className="px-4 py-3 text-center">
                        {effective.isWeekend ? (
                          effective.effectiveHours > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-purple-700 text-sm">{effective.effectiveHours} Jam</span>
                              {effective.status === 'VALID' ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Sesuai ACC
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {effective.badgeText}
                                </span>
                              )}
                            </div>
                          ) : approvedOt > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-400 font-medium text-sm">0 Jam</span>
                              {effective.status === 'NO_CLOCK_OUT' ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  {effective.badgeText || "Belum Pulang"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {effective.badgeText}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-[#1F77C5] hover:text-[#155b99] transition-colors p-1.5 rounded hover:bg-blue-50"
                            title="Edit Jam"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {record.attendance?.id && (
                            <button 
                              onClick={() => setDeleteTarget({
                                id: record.attendance!.id!,
                                name: record.user_name,
                                dateStr: record.dateStr || new Date(record.date).toISOString().split('T')[0]
                              })}
                              className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded hover:bg-red-50"
                              title="Hapus Presensi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div>
            Total <strong>{processedRecords.length}</strong> data presensi ditampilkan
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editMode ? 'Edit Data Manual' : 'Input Data Manual'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {selectedRecordOvertime && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                  <span className="font-bold text-amber-900">ℹ️ Info:</span>
                  <span>
                    {isWeekendDay(formData.recordDate)
                      ? `Karyawan ini memiliki pengajuan lembur Weekend yang disetujui (${selectedRecordOvertime} Jam). Jam lembur akhir pekan dihitung berdasarkan durasi jam masuk hingga jam keluar (maks. 8 jam).`
                      : `Karyawan ini memiliki pengajuan lembur Weekday yang disetujui (${selectedRecordOvertime} Jam). Jam lembur hari kerja dihitung saat Jam Keluar terisi dan melewati pukul 17:00 (maks. 3 jam).`}
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Karyawan</label>
                <select 
                  required
                  disabled={editMode}
                  value={formData.userId}
                  onChange={e => setFormData({...formData, userId: e.target.value})}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5] disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Pilih Karyawan / Pengguna...</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} {u.role && u.role !== 'STAFF' ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tanggal</label>
                  <input 
                    type="date"
                    required
                    disabled={editMode}
                    value={formData.recordDate}
                    onChange={e => setFormData({...formData, recordDate: e.target.value})}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5] disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Status Kehadiran</label>
                  <select 
                    value={formData.attendanceStatus}
                    onChange={e => setFormData({...formData, attendanceStatus: e.target.value as any})}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5]"
                  >
                    <option value="">-- Kosong --</option>
                    <option value="HADIR">Hadir</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="IZIN">Izin</option>
                    <option value="ALPHA">Alpha</option>
                  </select>
                </div>
              </div>

              {formData.attendanceStatus !== '' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Jam Masuk</label>
                    <input 
                      type="time"
                      lang="en-GB"
                      value={formData.clockIn}
                      onChange={e => setFormData({...formData, clockIn: e.target.value})}
                      className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Jam Keluar (Opsional)</label>
                    <input 
                      type="time"
                      lang="en-GB"
                      value={formData.clockOut}
                      onChange={e => setFormData({...formData, clockOut: e.target.value})}
                      className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F77C5]"
                    />
                  </div>
                </div>
              )}



              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#1F77C5] hover:bg-[#1a64a6] text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Hapus Data Presensi?</h3>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus data presensi untuk <strong className="text-slate-700">{deleteTarget.name}</strong> pada tanggal <strong className="text-slate-700">{new Date(deleteTarget.dateStr + "T00:00:00").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>? Data ini akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
