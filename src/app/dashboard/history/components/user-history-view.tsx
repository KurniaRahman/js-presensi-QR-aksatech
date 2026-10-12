"use client"

import { useState, useEffect, useMemo } from "react"
import { getUserHistoryData, UserHistoryResponse, UserHistoryItem } from "@/actions/user-history"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Coffee,
  Search,
  Filter,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from "lucide-react"

export function UserHistoryView() {
  // Rentang default: bulan ini (1 s/d hari ini)
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

  const [data, setData] = useState<UserHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const res = await getUserHistoryData(startDate, endDate)
      setData(res)
    } catch (err) {
      console.error("Gagal mengambil data riwayat:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [startDate, endDate])

  // Filter cepat
  const setQuickFilter = (type: 'this_month' | 'last_month' | 'last_30_days') => {
    const now = new Date()
    if (type === 'this_month') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setStartDate(`${y}-${m}-01`)
      setEndDate(`${y}-${m}-${d}`)
    } else if (type === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
      const y = prev.getFullYear()
      const m = String(prev.getMonth() + 1).padStart(2, '0')
      const d = String(lastDay.getDate()).padStart(2, '0')
      setStartDate(`${y}-${m}-01`)
      setEndDate(`${y}-${m}-${d}`)
    } else if (type === 'last_30_days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const y1 = past.getFullYear()
      const m1 = String(past.getMonth() + 1).padStart(2, '0')
      const d1 = String(past.getDate()).padStart(2, '0')
      const y2 = now.getFullYear()
      const m2 = String(now.getMonth() + 1).padStart(2, '0')
      const d2 = String(now.getDate()).padStart(2, '0')
      setStartDate(`${y1}-${m1}-${d1}`)
      setEndDate(`${y2}-${m2}-${d2}`)
    }
  }

  type SortCol = "date" | "status" | "clockIn" | "clockOut" | "duration" | "otWeekday" | "otWeekend"
  const [sortCol, setSortCol] = useState<SortCol>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

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

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 inline-block ml-1" />
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#1F77C5] inline-block ml-1" />
    )
  }

  const processedRecords = useMemo(() => {
    let list = (data?.records || []).filter(item => {
      // Filter status
      if (statusFilter === "HADIR" && item.attendance?.status !== "HADIR") return false
      if (statusFilter === "LEMBUR" && item.effectiveOvertime.effectiveHours <= 0) return false
      if (statusFilter === "TIDAK_HADIR" && (!item.attendance || item.attendance.status === "HADIR")) return false

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const dateText = new Date(item.dateStr + "T00:00:00").toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).toLowerCase()
        return dateText.includes(q) || (item.overtime?.reason?.toLowerCase().includes(q) ?? false)
      }

      return true
    })

    list.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortCol) {
        case "date":
          valA = new Date(a.dateStr).getTime()
          valB = new Date(b.dateStr).getTime()
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
        case "duration":
          valA = a.attendance?.duration_minutes || 0
          valB = b.attendance?.duration_minutes || 0
          break
        case "otWeekday":
          valA = !a.isWeekend ? a.effectiveOvertime.effectiveHours : -1
          valB = !b.isWeekend ? b.effectiveOvertime.effectiveHours : -1
          break
        case "otWeekend":
          valA = a.isWeekend ? a.effectiveOvertime.effectiveHours : -1
          valB = b.isWeekend ? b.effectiveOvertime.effectiveHours : -1
          break
        default:
          valA = 0
          valB = 0
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1
      if (valA > valB) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return list
  }, [data?.records, statusFilter, searchQuery, sortCol, sortDir])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Riwayat & Rekapitulasi Kerja</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Pantau rincian kehadiran, jam kerja, dan jam lembur.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setQuickFilter('this_month')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#1F77C5] hover:bg-blue-100 font-medium whitespace-nowrap transition-colors"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setQuickFilter('last_month')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium whitespace-nowrap transition-colors"
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setQuickFilter('last_30_days')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium whitespace-nowrap transition-colors"
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>

        {/* Date Selector & Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm focus:outline-none text-slate-700 font-medium"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm focus:outline-none text-slate-700 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari hari/tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#1F77C5] transition-all bg-white"
              />
            </div>

            <div className="flex items-center space-x-1.5 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1F77C5] bg-white cursor-pointer font-medium text-slate-700"
              >
                <option value="ALL">Semua Data</option>
                <option value="HADIR">Hadir Saja</option>
                <option value="LEMBUR">Ada Lembur</option>
                <option value="TIDAK_HADIR">Izin/Sakit/Alpha</option>
              </select>

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

              <span className="text-xs bg-blue-50 text-[#1F77C5] font-semibold px-2.5 py-1 rounded-full border border-blue-100 hidden sm:inline-block">
                {processedRecords.length} Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Total Kehadiran */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kehadiran</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl md:text-3xl font-extrabold text-slate-800">
                {data.summary.hadirCount} <span className="text-xs md:text-sm font-medium text-slate-500">Hari</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 flex-wrap">
                {data.summary.sakitCount > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">Sakit: {data.summary.sakitCount}</span>}
                {data.summary.izinCount > 0 && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">Izin: {data.summary.izinCount}</span>}
                {data.summary.alphaCount > 0 && <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">Alpha: {data.summary.alphaCount}</span>}
              </div>
            </div>
          </div>

          {/* Card 2: Total Jam Kerja */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jam Kerja</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg md:text-2xl font-extrabold text-slate-800 truncate" title={data.summary.totalWorkFormatted}>
                {data.summary.totalWorkFormatted}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Akumulasi durasi kerja efektif
              </p>
            </div>
          </div>

          {/* Card 3: Lembur Weekday */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lembur Weekday</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl md:text-3xl font-extrabold text-indigo-700">
                {data.summary.totalLemburWeekday} <span className="text-xs md:text-sm font-medium text-slate-500">Jam</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Setelah 17:00 (maks. 3j/hari)
              </p>
            </div>
          </div>

          {/* Card 4: Lembur Weekend */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lembur Weekend</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl md:text-3xl font-extrabold text-purple-700">
                {data.summary.totalLemburWeekend} <span className="text-xs md:text-sm font-medium text-slate-500">Jam</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Akhir pekan (maks. 8j/hari)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Table on Desktop, Cards on Mobile */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#1F77C5] animate-spin" />
          <p className="text-sm font-medium text-slate-500">Mengambil data riwayat presensi...</p>
        </div>
      ) : processedRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-700 font-bold">Tidak ada riwayat presensi</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ditemukan catatan kehadiran atau lembur pada periode tanggal yang dipilih.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-3 md:hidden">
            {processedRecords.map((item) => {
              const formattedDate = new Date(item.dateStr + "T00:00:00").toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })

              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        item.isWeekend ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isWeekend ? 'Akhir Pekan' : 'Hari Kerja'}
                      </span>
                    </div>

                    {item.attendance ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.attendance.status === 'HADIR' ? 'bg-green-50 text-green-600' : 
                        item.attendance.status === 'SAKIT' ? 'bg-amber-50 text-amber-600' : 
                        item.attendance.status === 'IZIN' ? 'bg-blue-50 text-blue-600' : 
                        'bg-red-50 text-red-600'
                      }`}>
                        {item.attendance.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-400">-</span>
                    )}
                  </div>

                  {/* Jam Masuk & Jam Keluar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Masuk</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {item.attendance && item.attendance.status === 'HADIR' ? new Date(item.attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Keluar</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {item.attendance?.clock_out && item.attendance.status === 'HADIR' ? new Date(item.attendance.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Durasi</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {item.attendance?.duration_minutes 
                          ? `${Math.floor(item.attendance.duration_minutes / 60)}j ${item.attendance.duration_minutes % 60}m`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Lembur Section */}
                  {item.overtime && (
                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Lembur {item.isWeekend ? 'Weekend' : 'Weekday'}</span>
                        </span>
                        <span className="font-bold text-slate-800">
                          {item.effectiveOvertime.effectiveHours} Jam
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-amber-100">
                        <span>Alasan: {item.overtime.reason}</span>
                        {item.effectiveOvertime.status === 'VALID' ? (
                          <span className="text-emerald-700 bg-emerald-100/60 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                            ✓ Sesuai ACC
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-100/60 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                            {item.effectiveOvertime.badgeText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th 
                      onClick={() => handleSort("date")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Tanggal</span>
                        <SortIcon col="date" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("status")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Status</span>
                        <SortIcon col="status" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("clockIn")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Jam Masuk</span>
                        <SortIcon col="clockIn" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("clockOut")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Jam Keluar</span>
                        <SortIcon col="clockOut" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("duration")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Durasi Kerja</span>
                        <SortIcon col="duration" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("otWeekday")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <span>Lembur Weekday</span>
                        <SortIcon col="otWeekday" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("otWeekend")}
                      className="px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <span>Lembur Weekend</span>
                        <SortIcon col="otWeekend" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRecords.map((item) => {
                    const formattedDate = new Date(item.dateStr + "T00:00:00").toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          <div className="flex items-center space-x-2">
                            <span>{formattedDate}</span>
                            {item.isWeekend ? (
                              <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                Weekend
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {item.attendance ? (
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                              item.attendance.status === 'HADIR' ? 'bg-green-50 text-green-600' : 
                              item.attendance.status === 'SAKIT' ? 'bg-amber-50 text-amber-600' : 
                              item.attendance.status === 'IZIN' ? 'bg-blue-50 text-blue-600' : 
                              'bg-red-50 text-red-600'
                            }`}>
                              {item.attendance.status}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {item.attendance && item.attendance.status === 'HADIR'
                            ? new Date(item.attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                            : '-'}
                        </td>

                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {item.attendance?.clock_out && item.attendance.status === 'HADIR'
                            ? new Date(item.attendance.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                            : '-'}
                        </td>

                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {item.attendance?.duration_minutes 
                            ? `${Math.floor(item.attendance.duration_minutes / 60)}j ${item.attendance.duration_minutes % 60}m` 
                            : '-'}
                        </td>

                        {/* Lembur Weekday */}
                        <td className="px-5 py-3.5 text-center">
                          {!item.isWeekend ? (
                            item.effectiveOvertime.effectiveHours > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-slate-800 text-sm">{item.effectiveOvertime.effectiveHours} Jam</span>
                                {item.effectiveOvertime.status === 'VALID' ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ Sesuai ACC
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {item.effectiveOvertime.badgeText}
                                  </span>
                                )}
                              </div>
                            ) : item.overtime?.status === 'APPROVED' ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-slate-400 font-medium text-sm">0 Jam</span>
                                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  {item.effectiveOvertime.badgeText || 'Belum Pulang'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Lembur Weekend */}
                        <td className="px-5 py-3.5 text-center">
                          {item.isWeekend ? (
                            item.effectiveOvertime.effectiveHours > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-purple-700 text-sm">{item.effectiveOvertime.effectiveHours} Jam</span>
                                {item.effectiveOvertime.status === 'VALID' ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ Sesuai ACC
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {item.effectiveOvertime.badgeText}
                                  </span>
                                )}
                              </div>
                            ) : item.overtime?.status === 'APPROVED' ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-slate-400 font-medium text-sm">0 Jam</span>
                                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  {item.effectiveOvertime.badgeText || 'Belum Pulang'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <div>
                Total <strong>{processedRecords.length}</strong> data riwayat kerja ditampilkan
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
