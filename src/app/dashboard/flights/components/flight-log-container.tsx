"use client"

import { useState, useTransition, useMemo } from "react"
import {
  getDroneFlightLogs,
  createDroneFlightLog,
  updateDroneFlightLog,
  deleteDroneFlightLog
} from "@/actions/drone-flight"
import { formatDateWIB, getDateStringWIB } from "@/lib/attendance-utils"
import * as XLSX from "xlsx"
import {
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  Plus,
  Search,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Loader2,
  Cpu,
  Target,
  GraduationCap,
  Battery,
  User as UserIcon,
  AlertCircle
} from "lucide-react"

type PresetType = "ALL" | "TODAY" | "7DAYS" | "30DAYS" | "THIS_MONTH"

export type DroneItem = {
  id: string
  serial_number: string
  model_name: string
  status: string
}

export type FlightLogItem = {
  id: string
  drone_id: string
  user_id: string
  flight_date: Date | string
  takeoff_time: string
  landing_time: string
  duration_minutes: number
  mission_type: string
  battery_1: string
  battery_2: string | null
  notes: string | null
  created_at: Date | string
  drone: {
    id: string
    serial_number: string
    model_name: string
    status: string
  }
  user: {
    id: string
    full_name: string
    role: string
    email: string
  }
}

interface FlightLogContainerProps {
  userRole: "STAFF" | "PM"
  currentUserId: string
  initialDrones: DroneItem[]
  initialLogs: FlightLogItem[]
  initialStartDate: string
  initialEndDate: string
  todayStr: string
}

export function FlightLogContainer({
  userRole,
  currentUserId,
  initialDrones,
  initialLogs,
  initialStartDate,
  initialEndDate,
  todayStr,
}: FlightLogContainerProps) {
  const [isPending, startTransition] = useTransition()
  const isSupervisor = userRole === "PM"

  // Master Drones & Flight Logs
  const [drones] = useState<DroneItem[]>(initialDrones)
  const [logs, setLogs] = useState<FlightLogItem[]>(initialLogs)

  // Filters
  const [droneFilter, setDroneFilter] = useState<string>("ALL")
  const [missionFilter, setMissionFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activePreset, setActivePreset] = useState<string>("30DAYS")
  const [startDate, setStartDate] = useState<string>(initialStartDate)
  const [endDate, setEndDate] = useState<string>(initialEndDate)
  const [isExporting, setIsExporting] = useState(false)

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FlightLogItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [formDroneId, setFormDroneId] = useState<string>("")
  const [formDate, setFormDate] = useState<string>(todayStr)
  const [formTakeoff, setFormTakeoff] = useState<string>("08:00")
  const [formLanding, setFormLanding] = useState<string>("08:45")
  const [formMission, setFormMission] = useState<string>("TRAINING")
  const [formBattery1, setFormBattery1] = useState<string>("")
  const [formBattery2, setFormBattery2] = useState<string>("")
  const [formNotes, setFormNotes] = useState<string>("")

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<FlightLogItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Selected Drone in Form (to check model)
  const selectedDroneInForm = useMemo(() => {
    return drones.find((d) => d.id === formDroneId) || null
  }, [drones, formDroneId])

  // Apakah model membutuhkan 2 baterai (Model AR & Model Revolver)
  const isDualBattery = useMemo(() => {
    if (!selectedDroneInForm) return false
    const model = selectedDroneInForm.model_name
    return model.includes("AR") || model.includes("Revolver")
  }, [selectedDroneInForm])

  // Live calculation of duration
  const liveDurationMinutes = useMemo(() => {
    if (!formTakeoff || !formLanding) return 0
    const [tH, tM] = formTakeoff.split(":").map(Number)
    const [lH, lM] = formLanding.split(":").map(Number)
    if (isNaN(tH) || isNaN(tM) || isNaN(lH) || isNaN(lM)) return 0

    let diff = lH * 60 + lM - (tH * 60 + tM)
    if (diff < 0) diff += 24 * 60
    return diff
  }, [formTakeoff, formLanding])

  // Format durasi menit ke "X Jam Y Menit" atau "X Menit"
  const formatDurationDisplay = (mins: number) => {
    if (mins <= 0) return "0 Menit"
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    if (hours === 0) return `${remainingMins} Menit`
    if (remainingMins === 0) return `${hours} Jam`
    return `${hours} Jam ${remainingMins} Menit`
  }

  // Reload logs from server with current date range
  const reloadLogs = (start?: string, end?: string) => {
    const s = start !== undefined ? start : startDate
    const e = end !== undefined ? end : endDate
    startTransition(async () => {
      try {
        const res = await getDroneFlightLogs({
          startDate: s,
          endDate: e,
        })
        if (res.success && res.data) {
          setLogs(res.data as FlightLogItem[])
        }
      } catch (err: unknown) {
        console.error("Gagal memuat log penerbangan:", err)
      }
    })
  }

  // Date range presets
  const applyPreset = (preset: PresetType) => {
    setActivePreset(preset)
    const now = new Date()
    const today = getDateStringWIB(now)

    if (preset === "ALL") {
      setStartDate("")
      setEndDate("")
      reloadLogs("", "")
      return
    }

    if (preset === "TODAY") {
      setStartDate(today)
      setEndDate(today)
      reloadLogs(today, today)
      return
    }

    if (preset === "7DAYS") {
      const past = new Date(now)
      past.setDate(past.getDate() - 6)
      const pastStr = getDateStringWIB(past)
      setStartDate(pastStr)
      setEndDate(today)
      reloadLogs(pastStr, today)
      return
    }

    if (preset === "30DAYS") {
      const past = new Date(now)
      past.setDate(past.getDate() - 29)
      const pastStr = getDateStringWIB(past)
      setStartDate(pastStr)
      setEndDate(today)
      reloadLogs(pastStr, today)
      return
    }

    if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayStr = getDateStringWIB(firstDay)
      setStartDate(firstDayStr)
      setEndDate(today)
      reloadLogs(firstDayStr, today)
      return
    }
  }

  // Open Add Modal
  const openAddModal = (defaultDroneId?: string) => {
    setEditTarget(null)
    setFormError(null)
    setFormDroneId(defaultDroneId || (drones.length > 0 ? drones[0].id : ""))
    setFormDate(todayStr)
    setFormTakeoff("08:00")
    setFormLanding("08:45")
    setFormMission("TRAINING")
    setFormBattery1("")
    setFormBattery2("")
    setFormNotes("")
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (item: FlightLogItem) => {
    setEditTarget(item)
    setFormError(null)
    setFormDroneId(item.drone_id)

    const dateStr = typeof item.flight_date === "string"
      ? item.flight_date.split("T")[0]
      : getDateStringWIB(item.flight_date)
    setFormDate(dateStr)
    setFormTakeoff(item.takeoff_time)
    setFormLanding(item.landing_time)
    setFormMission(item.mission_type)
    setFormBattery1(item.battery_1)
    setFormBattery2(item.battery_2 || "")
    setFormNotes(item.notes || "")
    setIsModalOpen(true)
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formDroneId) {
      setFormError("Pilih unit drone terlebih dahulu.")
      return
    }

    if (!formDate) {
      setFormError("Tanggal penerbangan wajib diisi.")
      return
    }

    if (!formTakeoff || !formLanding) {
      setFormError("Jam take-off dan landing wajib diisi.")
      return
    }

    if (liveDurationMinutes <= 0) {
      setFormError("Jam landing harus lebih lambat dari jam take-off.")
      return
    }

    if (!formBattery1.trim()) {
      setFormError("Nomor baterai 1 wajib diisi (contoh: A).")
      return
    }

    if (isDualBattery && !formBattery2.trim()) {
      setFormError(`Unit ${selectedDroneInForm?.model_name} memerlukan 2 nomor baterai (Baterai 1 dan Baterai 2).`)
      return
    }

    setIsSubmitting(true)
    try {
      if (editTarget) {
        const res = await updateDroneFlightLog(editTarget.id, {
          flight_date: formDate,
          takeoff_time: formTakeoff,
          landing_time: formLanding,
          mission_type: formMission,
          battery_1: formBattery1.trim().toUpperCase(),
          battery_2: isDualBattery ? formBattery2.trim().toUpperCase() : undefined,
          notes: formNotes.trim() || undefined,
        })
        if (res.success && res.data) {
          setLogs((prev) =>
            prev.map((l) => (l.id === editTarget.id ? (res.data as FlightLogItem) : l))
          )
          setIsModalOpen(false)
        }
      } else {
        const res = await createDroneFlightLog({
          drone_id: formDroneId,
          flight_date: formDate,
          takeoff_time: formTakeoff,
          landing_time: formLanding,
          mission_type: formMission,
          battery_1: formBattery1.trim().toUpperCase(),
          battery_2: isDualBattery ? formBattery2.trim().toUpperCase() : undefined,
          notes: formNotes.trim() || undefined,
        })
        if (res.success && res.data) {
          setLogs((prev) => [res.data as FlightLogItem, ...prev])
          setIsModalOpen(false)
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan catatan penerbangan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await deleteDroneFlightLog(deleteTarget.id)
      if (res.success) {
        setLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus log penerbangan.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter drone
      if (droneFilter !== "ALL" && log.drone_id !== droneFilter) {
        return false
      }
      // Filter mission
      if (missionFilter !== "ALL" && log.mission_type !== missionFilter) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchSN = log.drone?.serial_number?.toLowerCase().includes(q)
        const matchModel = log.drone?.model_name?.toLowerCase().includes(q)
        const matchNotes = log.notes?.toLowerCase().includes(q)
        const matchPilot = log.user?.full_name?.toLowerCase().includes(q)
        const matchBat1 = log.battery_1?.toLowerCase().includes(q)
        const matchBat2 = log.battery_2?.toLowerCase().includes(q)
        if (!matchSN && !matchModel && !matchNotes && !matchPilot && !matchBat1 && !matchBat2) {
          return false
        }
      }
      return true
    })
  }, [logs, droneFilter, missionFilter, searchQuery])

  // Summary Metrics
  const totalFlights = filteredLogs.length
  const totalAirtimeMinutes = filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
  const trainingCount = filteredLogs.filter((l) => l.mission_type === "TRAINING").length
  const missionCount = filteredLogs.filter((l) => l.mission_type === "MISSION").length
  const missionPercentage = totalFlights > 0 ? Math.round((missionCount / totalFlights) * 100) : 0

  // Export to Excel
  const exportToExcel = () => {
    if (filteredLogs.length === 0) return

    setIsExporting(true)
    try {
      const dataRows = filteredLogs.map((item, idx) => {
        const dateObj = typeof item.flight_date === "string" ? new Date(item.flight_date) : item.flight_date
        const dateFormatted = formatDateWIB(dateObj, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })

        return {
          "No": idx + 1,
          "Tanggal": dateFormatted,
          "Serial Number": item.drone?.serial_number || "-",
          "Model Drone": item.drone?.model_name || "-",
          "Jam Take-off": item.takeoff_time,
          "Jam Landing": item.landing_time,
          "Durasi (Menit)": item.duration_minutes,
          "Jenis Misi": item.mission_type === "MISSION" ? "Misi" : "Latihan",
          "Nomor Baterai 1": item.battery_1,
          "Nomor Baterai 2": item.battery_2 || "-",
          "Pilot / Pencatat": item.user?.full_name || "-",
          "Catatan": item.notes || "-",
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(dataRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Penerbangan")

      worksheet["!cols"] = [
        { wch: 5 },  // No
        { wch: 18 }, // Tanggal
        { wch: 16 }, // SN
        { wch: 18 }, // Model
        { wch: 12 }, // Takeoff
        { wch: 12 }, // Landing
        { wch: 14 }, // Durasi
        { wch: 14 }, // Misi
        { wch: 16 }, // Bat 1
        { wch: 16 }, // Bat 2
        { wch: 22 }, // Pilot
        { wch: 32 }, // Catatan
      ]

      const s = startDate || "Awal"
      const e = endDate || "Sekarang"
      XLSX.writeFile(workbook, `Log_Penerbangan_Drone_${s}_to_${e}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Responsive KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penerbangan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Penerbangan
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
              {totalFlights}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Flight terdata di filter ini</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 shadow-xs">
            <PlaneTakeoff className="w-6 h-6" />
          </div>
        </div>

        {/* Total Jam Terbang (Airtime) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Total Durasi Terbang
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
              {formatDurationDisplay(totalAirtimeMinutes)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Akumulasi {totalAirtimeMinutes.toLocaleString()} menit
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Misi vs Latihan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              Distribusi Misi
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
              {missionCount} <span className="text-sm font-semibold text-slate-500">Misi</span> / {trainingCount} <span className="text-sm font-semibold text-slate-500">Latihan</span>
            </h3>
            <p className="text-xs text-purple-600 font-semibold mt-0.5">
              {missionPercentage}% Penerbangan Misi
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Status Armada Terdaftar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Armada Terdaftar
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
              {drones.length}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Unit drone aktif & terdata</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Toolbar Filter & Action Buttons */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        {/* Baris 1: Filter Cepat Tanggal Preset & Tombol Tambah */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> Rentang:
            </span>
            {[
              { id: "TODAY" as const, label: "Hari Ini" },
              { id: "7DAYS" as const, label: "7 Hari Terakhir" },
              { id: "30DAYS" as const, label: "30 Hari Terakhir" },
              { id: "THIS_MONTH" as const, label: "Bulan Ini" },
              { id: "ALL" as const, label: "Semua Waktu" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  activePreset === p.id
                    ? "bg-[#1F77C5] text-white border-[#1F77C5] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={isExporting || filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              title={filteredLogs.length === 0 ? "Tidak ada data untuk diekspor" : "Ekspor rekap log penerbangan ke Excel"}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExporting ? "Mengunduh..." : "Export Excel"}</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1F77C5] text-white hover:bg-blue-600 transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Penerbangan</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Search Box & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SN, pilot, catatan, baterai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
            />
          </div>

          {/* Filter Unit Drone */}
          <div className="relative">
            <select
              value={droneFilter}
              onChange={(e) => setDroneFilter(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-medium bg-white text-slate-700"
            >
              <option value="ALL">Semua Unit Drone</option>
              {drones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.serial_number} • {d.model_name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Misi */}
          <div className="relative">
            <select
              value={missionFilter}
              onChange={(e) => setMissionFilter(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-medium bg-white text-slate-700"
            >
              <option value="ALL">Semua Jenis Misi</option>
              <option value="TRAINING">🎓 Latihan (Training)</option>
              <option value="MISSION">🎯 Misi (Mission)</option>
            </select>
          </div>

          {/* Info Hasil Filter */}
          <div className="flex items-center justify-between sm:justify-end text-xs text-slate-500 font-semibold px-1">
            {isPending ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat data...
              </span>
            ) : (
              <span>Menampilkan {filteredLogs.length} penerbangan</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Daftar / Tabel Riwayat Penerbangan */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-slate-300 space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 mx-auto flex items-center justify-center shadow-xs">
            <PlaneTakeoff className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Log Penerbangan Ditemukan</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Belum ada catatan penerbangan yang sesuai dengan filter. Silakan ubah filter atau catat penerbangan baru.
          </p>
          <button
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Penerbangan Baru</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((item) => {
            const dateObj = typeof item.flight_date === "string" ? new Date(item.flight_date) : item.flight_date
            const isOwner = item.user_id === currentUserId
            const canManage = isOwner || isSupervisor

            const isTraining = item.mission_type === "TRAINING"

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Info Unit, Waktu & Baterai */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* SN Drone */}
                    <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                      {item.drone?.serial_number || "Drone"}
                    </span>
                    {/* Model */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.drone?.model_name || "Unknown"}
                    </span>
                    {/* Jenis Misi Badge */}
                    {isTraining ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        Latihan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1F77C5] border border-blue-200">
                        <Target className="w-3.5 h-3.5 text-[#1F77C5]" />
                        Misi
                      </span>
                    )}

                    {/* Durasi Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      <Clock className="w-3 h-3 text-sky-600" />
                      {item.duration_minutes} Menit
                    </span>
                  </div>

                  {/* Waktu & Nomor Baterai */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <PlaneTakeoff className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Take-off:</span>
                      <strong className="font-mono text-slate-800">{item.takeoff_time}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <PlaneLanding className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Landing:</span>
                      <strong className="font-mono text-slate-800">{item.landing_time}</strong>
                    </div>

                    {/* Baterai */}
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <Battery className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Baterai:</span>
                      <span className="font-mono font-bold text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {item.battery_1}
                      </span>
                      {item.battery_2 && (
                        <>
                          <span className="text-slate-400">+</span>
                          <span className="font-mono font-bold text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {item.battery_2}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Catatan Tambahan jika ada */}
                  {item.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      &quot;{item.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Right: Tanggal, Pilot & Aksi */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {formatDateWIB(dateObj, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <UserIcon className="w-3 h-3" />
                      <span>{item.user?.full_name || "Pilot"}</span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F77C5] hover:bg-blue-50 transition-colors"
                        title="Edit Catatan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Modal Tambah / Edit Catatan Penerbangan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-[#1F77C5]" />
                {editTarget ? "Edit Log Penerbangan" : "Catat Penerbangan Drone"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dropdown Unit Drone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Unit Drone (SN) *
                </label>
                <select
                  value={formDroneId}
                  onChange={(e) => setFormDroneId(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-semibold bg-white text-slate-800"
                  required
                >
                  <option value="" disabled>Pilih Drone...</option>
                  {drones.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.serial_number} • {d.model_name}
                    </option>
                  ))}
                </select>
                {selectedDroneInForm && (
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Model: <strong className="text-slate-700">{selectedDroneInForm.model_name}</strong>
                    {isDualBattery ? " (Menggunakan 2 Baterai)" : " (Menggunakan 1 Baterai)"}
                  </p>
                )}
              </div>

              {/* Tanggal Penerbangan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tanggal Penerbangan *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none font-medium bg-white text-slate-800"
                  required
                />
              </div>

              {/* Waktu: Jam Take-off & Jam Landing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <PlaneTakeoff className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jam Take-off *</span>
                  </label>
                  <input
                    type="time"
                    value={formTakeoff}
                    onChange={(e) => setFormTakeoff(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none font-mono font-bold text-slate-800 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <PlaneLanding className="w-3.5 h-3.5 text-sky-600" />
                    <span>Jam Landing *</span>
                  </label>
                  <input
                    type="time"
                    value={formLanding}
                    onChange={(e) => setFormLanding(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none font-mono font-bold text-slate-800 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Live Preview Durasi Otomatis */}
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-sky-800 font-semibold">
                  <Clock className="w-4 h-4 text-sky-600" /> Total Durasi Penerbangan:
                </span>
                <span className="font-mono font-extrabold text-[#1F77C5] text-sm">
                  {liveDurationMinutes > 0 ? `${liveDurationMinutes} Menit` : "0 Menit"}
                </span>
              </div>

              {/* Pilihan Misi Terbang (Latihan vs Misi) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Misi Terbang *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormMission("TRAINING")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formMission === "TRAINING"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Latihan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMission("MISSION")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formMission === "MISSION"
                        ? "bg-blue-50 text-[#1F77C5] border-blue-300 ring-2 ring-[#1F77C5]/20 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Target className="w-4 h-4 text-[#1F77C5]" />
                    <span>Misi</span>
                  </button>
                </div>
              </div>

              {/* Nomor Baterai (Dinamis: 1 Baterai untuk TR, 2 Baterai untuk AR & Revolver) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Nomor Baterai (Kode Huruf A, B, C...) *</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {isDualBattery ? "Wajib 2 Baterai" : "Wajib 1 Baterai"}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Baterai 1 */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Baterai 1 *</span>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Contoh: A"
                      value={formBattery1}
                      onChange={(e) => setFormBattery1(e.target.value.toUpperCase().slice(0, 2))}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none font-mono font-extrabold uppercase text-center text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Baterai 2 (Hanya aktif/wajib untuk model AR dan Revolver) */}
                  {isDualBattery ? (
                    <div className="space-y-1 animate-fade-in">
                      <span className="text-[11px] font-semibold text-slate-500">Baterai 2 *</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="Contoh: B"
                        value={formBattery2}
                        onChange={(e) => setFormBattery2(e.target.value.toUpperCase().slice(0, 2))}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none font-mono font-extrabold uppercase text-center text-slate-800 bg-white"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 opacity-50 select-none">
                      <span className="text-[11px] font-semibold text-slate-400">Baterai 2</span>
                      <div className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 bg-slate-50 font-medium">
                        Tidak diperlukan (Model TR)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Catatan Tambahan</span>
                  <span className="text-[11px] font-normal text-slate-400">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan cuaca, kondisi terbang, atau observasi..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none resize-none bg-white text-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editTarget ? "Simpan Perubahan" : "Simpan Catatan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeleteTarget(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-800">Hapus Log Penerbangan?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catatan penerbangan unit{" "}
                <strong className="text-slate-700">{deleteTarget.drone?.serial_number}</strong> pada jam{" "}
                {deleteTarget.takeoff_time} - {deleteTarget.landing_time} akan dihapus permanen.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
