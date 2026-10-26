"use client"

import { useState, useTransition } from "react"
import {
  getDrones,
  createDrone,
  updateDrone,
  deleteDrone,
  getDroneMaintenanceLogs,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog
} from "@/actions/drone-maintenance"
import { formatTimeWIB, formatDateWIB, getDateStringWIB } from "@/lib/attendance-utils"
import * as XLSX from "xlsx"
import {
  Plane,
  Wrench,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Loader2,
  Cpu,
  RotateCcw,
  Sparkles,
  ChevronRight,
  History,
  Activity,
  Layers,
  Info
} from "lucide-react"

export type DroneItem = {
  id: string
  serial_number: string
  model_name: string
  status: string
  notes: string | null
  _count: {
    maintenance_logs: number
  }
  maintenance_logs?: Array<{
    maintenance_date: Date | string
    maintenance_type: string
    action_taken: string
    user: {
      full_name: string
    }
  }>
}

export type MaintenanceLogItem = {
  id: string
  drone_id: string
  user_id: string
  maintenance_date: Date | string
  maintenance_type: string
  issue_indication: string
  action_taken: string
  additional_notes: string | null
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

interface DroneLogbookContainerProps {
  userRole: "STAFF" | "PM"
  currentUserId: string
  initialDrones: DroneItem[]
  initialLogs: MaintenanceLogItem[]
  initialStartDate: string
  initialEndDate: string
  todayStr: string
}

export function DroneLogbookContainer({
  userRole,
  currentUserId,
  initialDrones,
  initialLogs,
  initialStartDate,
  initialEndDate,
  todayStr,
}: DroneLogbookContainerProps) {
  const isPM = userRole === "PM"

  // Main Tabs: "fleet" (Katalog Armada Drone) vs "logs" (Riwayat Servis Global)
  const [activeTab, setActiveTab] = useState<"fleet" | "logs">("fleet")

  // Data states
  const [drones, setDrones] = useState<DroneItem[]>(initialDrones)
  const [logs, setLogs] = useState<MaintenanceLogItem[]>(initialLogs)

  // Filters for Fleet Tab
  const [fleetModelFilter, setFleetModelFilter] = useState<string>("ALL")
  const [fleetStatusFilter, setFleetStatusFilter] = useState<string>("ALL")
  const [fleetSearchQuery, setFleetSearchQuery] = useState<string>("")

  // Filters for Logs Tab
  const [logDroneFilter, setLogDroneFilter] = useState<string>("ALL")
  const [logTypeFilter, setLogTypeFilter] = useState<string>("ALL")
  const [logSearchQuery, setLogSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [activePreset, setActivePreset] = useState<string>("30days")

  const [isPending, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)

  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------
  // 1. Modal Catat / Edit Perawatan Drone
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [editLogTarget, setEditLogTarget] = useState<MaintenanceLogItem | null>(null)
  const [formDroneId, setFormDroneId] = useState<string>("")
  const [formDate, setFormDate] = useState<string>(todayStr)
  const [formType, setFormType] = useState<string>("INSPECTION")
  const [formIssue, setFormIssue] = useState<string>("")
  const [formAction, setFormAction] = useState<string>("")
  const [formNotes, setFormNotes] = useState<string>("")
  const [formUpdateDroneStatus, setFormUpdateDroneStatus] = useState<string>("")
  const [logFormLoading, setLogFormLoading] = useState(false)
  const [logFormError, setLogFormError] = useState<string | null>(null)

  // 2. Modal Tambah / Edit Master Data Drone
  const [isDroneModalOpen, setIsDroneModalOpen] = useState(false)
  const [editDroneTarget, setEditDroneTarget] = useState<DroneItem | null>(null)
  const [formModel, setFormModel] = useState<string>("Model AR")
  const [formDroneNumber, setFormDroneNumber] = useState<string>("")
  const [formDroneStatus, setFormDroneStatus] = useState<string>("READY")
  const [droneFormLoading, setDroneFormLoading] = useState(false)
  const [droneFormError, setDroneFormError] = useState<string | null>(null)

  // 3. Modal Dedicated Logbook Drone (Detail Servis per Unit)
  const [selectedDroneForDetail, setSelectedDroneForDetail] = useState<DroneItem | null>(null)

  // 4. Modal Pop-up Konfirmasi Hapus Log
  const [logToDelete, setLogToDelete] = useState<MaintenanceLogItem | null>(null)
  const [isDeletingLog, setIsDeletingLog] = useState(false)
  const [deleteLogError, setDeleteLogError] = useState<string | null>(null)

  // 5. Modal Pop-up Konfirmasi Hapus Drone
  const [droneToDelete, setDroneToDelete] = useState<DroneItem | null>(null)
  const [isDeletingDrone, setIsDeletingDrone] = useState(false)
  const [deleteDroneError, setDeleteDroneError] = useState<string | null>(null)

  // ----------------------------------------------------
  // DATA FETCHING & FILTER HANDLERS
  // ----------------------------------------------------
  const refreshDrones = async () => {
    const res = await getDrones()
    if (res.success && res.data) {
      setDrones(res.data)
    }
  }

  const fetchLogs = (start: string, end: string, droneId: string = logDroneFilter, type: string = logTypeFilter) => {
    startTransition(async () => {
      const res = await getDroneMaintenanceLogs({
        startDate: start,
        endDate: end,
        droneId: droneId !== "ALL" ? droneId : undefined,
        type: type !== "ALL" ? type : undefined,
      })
      if (res.success && res.data) {
        setLogs(res.data as MaintenanceLogItem[])
      }
    })
  }

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

  const handleLogDroneFilterChange = (id: string) => {
    setLogDroneFilter(id)
    fetchLogs(startDate, endDate, id, logTypeFilter)
  }

  const handleLogTypeFilterChange = (type: string) => {
    setLogTypeFilter(type)
    fetchLogs(startDate, endDate, logDroneFilter, type)
  }

  // ----------------------------------------------------
  // LOG MODAL HANDLERS
  // ----------------------------------------------------
  const openAddLogModal = (preselectedDroneId?: string) => {
    setEditLogTarget(null)
    setFormDroneId(preselectedDroneId || (drones.length > 0 ? drones[0].id : ""))
    setFormDate(todayStr)
    setFormType("INSPECTION")
    setFormIssue("")
    setFormAction("")
    setFormNotes("")
    setFormUpdateDroneStatus("")
    setLogFormError(null)
    setIsLogModalOpen(true)
  }

  const openEditLogModal = (log: MaintenanceLogItem) => {
    setEditLogTarget(log)
    setFormDroneId(log.drone_id)
    const dateStr = typeof log.maintenance_date === "string"
      ? log.maintenance_date.split("T")[0]
      : getDateStringWIB(log.maintenance_date)
    setFormDate(dateStr)
    setFormType(log.maintenance_type)
    setFormIssue(log.issue_indication)
    setFormAction(log.action_taken)
    setFormNotes(log.additional_notes || "")
    setFormUpdateDroneStatus(log.drone.status || "READY")
    setLogFormError(null)
    setIsLogModalOpen(true)
  }

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDroneId) {
      setLogFormError("Pilih unit drone terlebih dahulu")
      return
    }
    if (!formIssue.trim()) {
      setLogFormError("Indikasi masalah / kendala wajib diisi")
      return
    }
    if (!formAction.trim()) {
      setLogFormError("Tindakan penanganan wajib diisi")
      return
    }

    setLogFormLoading(true)
    setLogFormError(null)

    try {
      if (editLogTarget) {
        const res = await updateMaintenanceLog(editLogTarget.id, {
          maintenance_date: formDate,
          maintenance_type: formType,
          issue_indication: formIssue,
          action_taken: formAction,
          additional_notes: formNotes,
          update_drone_status: formUpdateDroneStatus || undefined,
        })
        if (res.success && res.data) {
          setLogs(prev => prev.map(l => l.id === editLogTarget.id ? (res.data as any) : l))
          await refreshDrones()
          setIsLogModalOpen(false)
        }
      } else {
        const res = await createMaintenanceLog({
          drone_id: formDroneId,
          maintenance_date: formDate,
          maintenance_type: formType,
          issue_indication: formIssue,
          action_taken: formAction,
          additional_notes: formNotes,
          update_drone_status: formUpdateDroneStatus || undefined,
        })
        if (res.success && res.data) {
          setLogs(prev => [res.data as any, ...prev])
          await refreshDrones()
          setIsLogModalOpen(false)
        }
      }
    } catch (err: any) {
      setLogFormError(err.message || "Gagal menyimpan catatan perawatan")
    } finally {
      setLogFormLoading(false)
    }
  }

  const handleConfirmDeleteLog = async () => {
    if (!logToDelete) return
    setIsDeletingLog(true)
    setDeleteLogError(null)

    try {
      const res = await deleteMaintenanceLog(logToDelete.id)
      if (res.success) {
        setLogs(prev => prev.filter(l => l.id !== logToDelete.id))
        await refreshDrones()
        setLogToDelete(null)
      } else {
        setDeleteLogError("Gagal menghapus catatan")
      }
    } catch (err: any) {
      setDeleteLogError(err.message || "Gagal menghapus catatan")
    } finally {
      setIsDeletingLog(false)
    }
  }

  // ----------------------------------------------------
  // DRONE MASTER MODAL HANDLERS
  // ----------------------------------------------------
  const getDronePrefix = (model: string): string => {
    if (model === "Model TR") return "FT-"
    if (model === "Model Revolver") return "FR-"
    return "FA-"
  }

  const openAddDroneModal = () => {
    setEditDroneTarget(null)
    setFormModel("Model AR")
    setFormDroneNumber("")
    setFormDroneStatus("READY")
    setDroneFormError(null)
    setIsDroneModalOpen(true)
  }

  const openEditDroneModal = (drone: DroneItem) => {
    setEditDroneTarget(drone)
    const validModel = ["Model AR", "Model TR", "Model Revolver"].includes(drone.model_name)
      ? drone.model_name
      : "Model AR"
    setFormModel(validModel)

    // Ekstrak angka saja dari Serial Number (contoh: "FA-6065" -> "6065")
    const extractedNum = drone.serial_number.replace(/^[A-Za-z]+-?/, "")
    setFormDroneNumber(extractedNum)
    setFormDroneStatus(drone.status)
    setDroneFormError(null)
    setIsDroneModalOpen(true)
  }

  const handleDroneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNumber = formDroneNumber.trim()
    if (!cleanNumber) {
      setDroneFormError("Nomor seri drone wajib diisi")
      return
    }

    const prefix = getDronePrefix(formModel)
    const fullSN = `${prefix}${cleanNumber}`

    setDroneFormLoading(true)
    setDroneFormError(null)

    try {
      if (editDroneTarget) {
        const res = await updateDrone(editDroneTarget.id, {
          serial_number: fullSN,
          model_name: formModel,
          status: formDroneStatus,
        })
        if (res.success && res.data) {
          setDrones(prev => prev.map(d => d.id === editDroneTarget.id ? { ...d, ...res.data } : d))
          setIsDroneModalOpen(false)
        }
      } else {
        const res = await createDrone({
          serial_number: fullSN,
          model_name: formModel,
          status: formDroneStatus,
        })
        if (res.success && res.data) {
          await refreshDrones()
          setIsDroneModalOpen(false)
        }
      }
    } catch (err: any) {
      setDroneFormError(err.message || "Gagal menyimpan data drone")
    } finally {
      setDroneFormLoading(false)
    }
  }

  const handleConfirmDeleteDrone = async () => {
    if (!droneToDelete) return
    setIsDeletingDrone(true)
    setDeleteDroneError(null)

    try {
      const res = await deleteDrone(droneToDelete.id)
      if (res.success) {
        setDrones(prev => prev.filter(d => d.id !== droneToDelete.id))
        setLogs(prev => prev.filter(l => l.drone_id !== droneToDelete.id))
        setDroneToDelete(null)
      } else {
        setDeleteDroneError("Gagal menghapus drone")
      }
    } catch (err: any) {
      setDeleteDroneError(err.message || "Gagal menghapus unit drone")
    } finally {
      setIsDeletingDrone(false)
    }
  }

  // ----------------------------------------------------
  // EXPORT TO EXCEL (.xlsx)
  // ----------------------------------------------------
  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      const dataToExport = filteredLogs.map((item, index) => {
        const dateObj = typeof item.maintenance_date === "string" ? new Date(item.maintenance_date) : item.maintenance_date
        const dateStr = formatDateWIB(dateObj, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        const typeLabel =
          item.maintenance_type === "INSPECTION" ? "Inspeksi Berkala" :
            item.maintenance_type === "REPAIR" ? "Perbaikan" :
              "Penggantian Komponen"

        return {
          "No": index + 1,
          "Tanggal Perawatan": dateStr,
          "Serial Number (SN)": item.drone.serial_number,
          "Model Drone": item.drone.model_name,
          "Jenis Perawatan": typeLabel,
          "Indikasi Masalah / Kendala": item.issue_indication,
          "Tindakan Penanganan": item.action_taken,
          "Catatan Tambahan": item.additional_notes || "-",
          "Teknisi / Engineer": item.user.full_name,
          "Waktu Input (WIB)": formatTimeWIB(item.created_at),
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 18 },
        { wch: 20 },
        { wch: 22 },
        { wch: 40 },
        { wch: 45 },
        { wch: 30 },
        { wch: 25 },
        { wch: 18 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Perawatan")
      XLSX.writeFile(workbook, `Log_Perawatan_Drone_${startDate}_to_${endDate}.xlsx`)
    } catch (err) {
      alert("Gagal mengunduh file Excel")
    } finally {
      setIsExporting(false)
    }
  }

  // ----------------------------------------------------
  // FILTERED DATA
  // ----------------------------------------------------
  // 1. Filtered Fleet
  const filteredDrones = drones.filter(d => {
    if (fleetModelFilter !== "ALL" && d.model_name !== fleetModelFilter) return false
    if (fleetStatusFilter !== "ALL" && d.status !== fleetStatusFilter) return false
    if (fleetSearchQuery.trim()) {
      const q = fleetSearchQuery.toLowerCase()
      const matchSN = d.serial_number.toLowerCase().includes(q)
      const matchModel = d.model_name.toLowerCase().includes(q)
      if (!matchSN && !matchModel) return false
    }
    return true
  })

  // Group drones by model
  const modelsList = Array.from(new Set(drones.map(d => d.model_name)))

  // 2. Filtered Logs
  const filteredLogs = logs.filter(l => {
    if (logDroneFilter !== "ALL" && l.drone_id !== logDroneFilter) return false
    if (logTypeFilter !== "ALL" && l.maintenance_type !== logTypeFilter) return false
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase()
      const matchSN = l.drone.serial_number.toLowerCase().includes(q)
      const matchIssue = l.issue_indication.toLowerCase().includes(q)
      const matchAction = l.action_taken.toLowerCase().includes(q)
      const matchNotes = (l.additional_notes || "").toLowerCase().includes(q)
      const matchUser = l.user.full_name.toLowerCase().includes(q)
      if (!matchSN && !matchIssue && !matchAction && !matchNotes && !matchUser) return false
    }
    return true
  })

  // KPI Metrics
  const totalDronesCount = drones.length
  const readyDronesCount = drones.filter(d => d.status === "READY").length
  const maintenanceDronesCount = drones.filter(d => d.status === "IN_MAINTENANCE").length
  const totalLogsCount = logs.length
  const readinessRate = totalDronesCount > 0 ? Math.round((readyDronesCount / totalDronesCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* 1. Responsive KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Armada */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Armada Drone
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{totalDronesCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Unit terdata di sistem</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 shadow-xs">
            <Plane className="w-6 h-6" />
          </div>
        </div>

        {/* Siap Terbang (Ready) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/70 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Siap Operasi (Ready)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{readyDronesCount}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                {readinessRate}% Tingkat Kesiapan
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${readinessRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dalam Perbaikan / Servis */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Dalam Perbaikan
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{maintenanceDronesCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {maintenanceDronesCount > 0 ? "Unit dalam penanganan" : "Semua unit siap"}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Total Log Servis Tercatat */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Total Log Servis
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">{totalLogsCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{startDate} s/d {endDate}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Main Tab Switcher & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs w-full sm:max-w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "fleet"
              ? "bg-[#1F77C5] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Plane className="w-4 h-4" />
            <span>Armada Drone</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "fleet" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
            >
              {drones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "logs"
              ? "bg-[#1F77C5] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Perawatan</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "logs" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
            >
              {logs.length}
            </span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Tambah Drone (Bisa oleh Engineer dan PM) */}
          <button
            type="button"
            onClick={openAddDroneModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 hover:text-[#1F77C5] transition-all active:scale-[0.98] flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 text-[#1F77C5]" />
            <span>Tambah Drone</span>
          </button>

          {/* Catat Perawatan */}
          <button
            type="button"
            onClick={() => openAddLogModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#1F77C5] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all active:scale-[0.98] flex-1 sm:flex-initial"
          >
            <Wrench className="w-4 h-4" />
            <span>Catat Perawatan</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: ARMADA DRONE (FLEET VIEW) */}
      {/* ---------------------------------------------------- */}
      {activeTab === "fleet" && (
        <div className="space-y-5">
          {/* Fleet Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Model Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Layers className="w-3 h-3" />
                  Model:
                </span>
                <button
                  type="button"
                  onClick={() => setFleetModelFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${fleetModelFilter === "ALL"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                >
                  Semua ({drones.length})
                </button>
                {modelsList.map(model => {
                  const count = drones.filter(d => d.model_name === model).length
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setFleetModelFilter(model)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${fleetModelFilter === model
                        ? "bg-[#1F77C5] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                        }`}
                    >
                      <span>{model}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${fleetModelFilter === model ? "bg-blue-600 text-white" : "bg-white text-slate-600"
                        }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Status Filter Dropdown & Search */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={fleetStatusFilter}
                  onChange={(e) => setFleetStatusFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="READY">Siap Operasi (Ready)</option>
                  <option value="IN_MAINTENANCE">Dalam Perbaikan</option>
                  <option value="RETIRED">Pensiun / Nonaktif</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari SN atau Model..."
                    value={fleetSearchQuery}
                    onChange={(e) => setFleetSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-700 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Grid */}
          {filteredDrones.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-slate-300 space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 mx-auto flex items-center justify-center shadow-xs">
                <Plane className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Tidak Ada Unit Drone Ditemukan</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Silakan sesuaikan filter pencarian atau tambahkan unit drone baru ke dalam armada.
              </p>
              <button
                type="button"
                onClick={openAddDroneModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit Drone</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredDrones.map(drone => {
                const totalLogs = drone._count.maintenance_logs
                const latest = drone.maintenance_logs && drone.maintenance_logs.length > 0
                  ? drone.maintenance_logs[0]
                  : null

                const isReady = drone.status === "READY"
                const isInMaintenance = drone.status === "IN_MAINTENANCE"

                return (
                  <div
                    key={drone.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top status accent */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 ${isReady ? "bg-emerald-500" : isInMaintenance ? "bg-amber-500" : "bg-slate-300"
                        }`}
                    />

                    <div className="space-y-3.5">
                      {/* Card Header: SN & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-slate-900 tracking-tight">
                              {drone.serial_number}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {drone.model_name}
                            </span>
                          </div>
                          {drone.notes && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{drone.notes}</p>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isReady && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Siap Terbang
                          </span>
                        )}
                        {isInMaintenance && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            Servis
                          </span>
                        )}
                        {!isReady && !isInMaintenance && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            Pensiun
                          </span>
                        )}
                      </div>

                      {/* Service History Highlight */}
                      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1">
                            <History className="w-3.5 h-3.5 text-[#1F77C5]" />
                            Total Riwayat Servis:
                          </span>
                          <span className="font-bold text-slate-800">{totalLogs} kali</span>
                        </div>

                        {latest ? (
                          <div className="pt-1.5 border-t border-slate-200/60 text-[11px] space-y-0.5">
                            <p className="text-slate-400">
                              Terakhir:{" "}
                              <span className="font-semibold text-slate-700">
                                {formatDateWIB(latest.maintenance_date, { day: "numeric", month: "short", year: "numeric" })}
                              </span>{" "}
                              ({latest.maintenance_type === "INSPECTION" ? "Inspeksi" : latest.maintenance_type === "REPAIR" ? "Perbaikan" : "Penggantian"})
                            </p>
                            <p className="text-slate-500 line-clamp-1 italic">
                              "{latest.action_taken}"
                            </p>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-400 italic">
                            Belum ada catatan servis untuk unit ini.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditDroneModal(drone)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F77C5] hover:bg-blue-50 transition-all"
                          title="Edit Master Drone"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isPM && (
                          <button
                            type="button"
                            onClick={() => setDroneToDelete(drone)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Hapus Drone (PM)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDroneForDetail(drone)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-50 hover:text-[#1F77C5] transition-all"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Logbook</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openAddLogModal(drone.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1F77C5] text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Servis</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: RIWAYAT PERAWATAN (ALL LOGS TIMELINE) */}
      {/* ---------------------------------------------------- */}
      {activeTab === "logs" && (
        <div className="space-y-5">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-4">
            {/* Top Row: Date Range & Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Pickers & Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
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
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activePreset === p.id
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

              {/* Action: Export to Excel */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting || filteredLogs.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExporting ? "Mengunduh..." : "Ekspor Excel"}</span>
                </button>
              </div>
            </div>

            {/* Middle Row: Filter Drone & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {/* Drone SN Filter Selector */}
              <div className="relative w-full sm:w-64">
                <select
                  value={logDroneFilter}
                  onChange={(e) => handleLogDroneFilterChange(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 shadow-xs focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Drone ({drones.length} Unit)</option>
                  {drones.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.serial_number} — {d.model_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari indikasi, tindakan, atau teknisi..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-700 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                />
              </div>
            </div>

            {/* Bottom Row: Jenis Perawatan Tabs */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                Jenis:
              </span>
              {[
                { id: "ALL", label: "Semua Jenis" },
                { id: "INSPECTION", label: "Inspeksi Berkala" },
                { id: "REPAIR", label: "Perbaikan" },
                { id: "REPLACEMENT", label: "Penggantian Komponen" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleLogTypeFilterChange(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${logTypeFilter === tab.id
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Timeline List */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-slate-300 space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1F77C5] border border-blue-100 mx-auto flex items-center justify-center shadow-xs">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Tidak Ada Riwayat Perawatan</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Belum ada catatan servis yang sesuai dengan filter tanggal atau drone yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => openAddLogModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Perawatan Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map(item => {
                const dateObj = typeof item.maintenance_date === "string" ? new Date(item.maintenance_date) : item.maintenance_date
                const isOwner = item.user_id === currentUserId
                const canEditOrDelete = isOwner || isPM

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4 hover:border-blue-200 transition-all relative overflow-hidden"
                  >
                    {/* Top Row: Date, Drone SN & Model, Type Badge, and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Serial Number Drone Badge */}
                        <span className="font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-xl bg-slate-900 text-white shadow-xs">
                          {item.drone.serial_number}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          {item.drone.model_name}
                        </span>

                        <span>•</span>

                        {/* Jenis Perawatan Badge */}
                        {item.maintenance_type === "INSPECTION" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                            Inspeksi
                          </span>
                        )}
                        {item.maintenance_type === "REPAIR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            Perbaikan
                          </span>
                        )}
                        {item.maintenance_type === "REPLACEMENT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                            Pergantian
                          </span>
                        )}
                      </div>

                      {/* Right: Date & Edit/Delete Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
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

                        {canEditOrDelete && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditLogModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#1F77C5] hover:bg-blue-50 transition-all"
                              title="Edit Catatan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogToDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Structured Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                      {/* Indikasi Masalah / Kendala */}
                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100/90 space-y-1">
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Indikasi Masalah / Kendala
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                          {item.issue_indication}
                        </p>
                      </div>

                      {/* Tindakan Penanganan */}
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/90 space-y-1">
                        <p className="text-[11px] font-bold text-[#1F77C5] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Tindakan Penanganan
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                          {item.action_taken}
                        </p>
                      </div>
                    </div>

                    {/* Catatan Tambahan (jika ada) */}
                    {item.additional_notes && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-0.5">
                        <span className="font-bold text-slate-700">Catatan Tambahan: </span>
                        <span className="whitespace-pre-wrap break-words">{item.additional_notes}</span>
                      </div>
                    )}

                    {/* Footer: Teknisi & Waktu Input */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#1F77C5] text-white text-[9px] flex items-center justify-center font-bold">
                          {item.user.full_name.slice(0, 1)}
                        </span>
                        <span>Teknisi: <strong className="text-slate-700">{item.user.full_name}</strong> ({item.user.role === "STAFF" ? "Engineer" : item.user.role})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>Diinput pukul {formatTimeWIB(item.created_at)} WIB</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MODAL CATAT / EDIT PERAWATAN DRONE */}
      {/* ---------------------------------------------------- */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#1F77C5]" />
                {editLogTarget ? "Edit Catatan Perawatan" : "Catat Perawatan Drone"}
              </h3>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {logFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {logFormError}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4">
              {/* Pilih Serial Number Drone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Serial Number (SN) Drone *
                </label>
                <select
                  value={formDroneId}
                  onChange={(e) => setFormDroneId(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-semibold text-slate-800 bg-white"
                  required
                >
                  <option value="" disabled>-- Pilih Unit Drone --</option>
                  {drones.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.serial_number} — {d.model_name} ({d.status === "READY" ? "Siap" : "Servis"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Pengerjaan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tanggal Pengerjaan *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  required
                />
              </div>

              {/* Jenis Perawatan (3 Selector Buttons) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Jenis Perawatan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "INSPECTION", label: "Inspeksi", icon: ShieldCheck, color: "text-sky-700 border-sky-300 bg-sky-50" },
                    { id: "REPAIR", label: "Perbaikan", icon: Wrench, color: "text-amber-700 border-amber-300 bg-amber-50" },
                    { id: "REPLACEMENT", label: "Pergantian", icon: RotateCcw, color: "text-purple-700 border-purple-300 bg-purple-50" },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${formType === t.id
                        ? `${t.color} shadow-xs ring-2 ring-[#1F77C5]/20`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <t.icon className="w-4 h-4 mb-1" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Indikasi Masalah / Kendala */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Indikasi Masalah / Kendala *
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Getaran abnormal pada motor arm nomor 3, telemetry loss saat uji terbang..."
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  required
                />
              </div>

              {/* Tindakan Penanganan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tindakan Penanganan *
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Kalibrasi ulang ESC, pengencangan baut motor mount, dan penggantian propeller TR-32..."
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                  required
                />
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Nomor batch suku cadang, rekomendasi jam terbang berikutnya..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none"
                />
              </div>

              {/* Status Unit Drone Setelah Servis */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Perbarui Status Unit Drone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormUpdateDroneStatus("READY")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${formUpdateDroneStatus === "READY"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    ✅ Siap Terbang (Ready)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormUpdateDroneStatus("IN_MAINTENANCE")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${formUpdateDroneStatus === "IN_MAINTENANCE"
                      ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    🛠️ Masih Perlu Servis
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={logFormLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {logFormLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editLogTarget ? "Simpan Perubahan" : "Simpan Catatan Servis"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. MODAL TAMBAH / EDIT MASTER DATA DRONE */}
      {/* ---------------------------------------------------- */}
      {isDroneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1F77C5]" />
                {editDroneTarget ? "Edit Unit Drone" : "Tambah Unit Drone Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsDroneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {droneFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {droneFormError}
              </div>
            )}

            <form onSubmit={handleDroneSubmit} className="space-y-4">
              {/* Model Drone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Model Drone *
                </label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-semibold bg-white text-slate-800"
                >
                  <option value="Model AR">Model AR</option>
                  <option value="Model TR">Model TR</option>
                  <option value="Model Revolver">Model Revolver</option>
                </select>
              </div>

              {/* Serial Number dengan Prefix Otomatis */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Serial Number (SN) *</span>
                  <span className="text-[11px] font-normal text-slate-400">Hanya masukkan angka</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1F77C5]/20 focus-within:border-[#1F77C5] transition-all">
                  <span className="px-3.5 py-2.5 bg-slate-100 border-r border-slate-200 font-mono font-bold text-slate-700 text-xs sm:text-sm select-none shrink-0 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#1F77C5]" />
                    {getDronePrefix(formModel)}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 6071"
                    value={formDroneNumber}
                    onChange={(e) => setFormDroneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 outline-none font-mono font-bold text-slate-900 bg-transparent placeholder:text-slate-400 placeholder:font-normal"
                    required
                  />
                </div>
                {formDroneNumber && (
                  <p className="text-[11px] text-slate-500 pt-0.5 pl-1">
                    Serial Number lengkap: <span className="font-mono font-bold text-[#1F77C5]">{getDronePrefix(formModel)}{formDroneNumber}</span>
                  </p>
                )}
              </div>

              {/* Status Kelayakan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status Kelayakan
                </label>
                <select
                  value={formDroneStatus}
                  onChange={(e) => setFormDroneStatus(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F77C5]/20 focus:border-[#1F77C5] outline-none cursor-pointer font-semibold bg-white text-slate-800"
                >
                  <option value="READY">Siap Terbang (Ready)</option>
                  <option value="IN_MAINTENANCE">Dalam Perbaikan (In Maintenance)</option>
                  <option value="RETIRED">Pensiun / Nonaktif</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDroneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={droneFormLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {droneFormLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editDroneTarget ? "Simpan Perubahan" : "Tambah Drone"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. MODAL DEDICATED LOGBOOK DETAIL KHUSUS DRONE */}
      {/* ---------------------------------------------------- */}
      {selectedDroneForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-extrabold text-slate-900">
                    {selectedDroneForDetail.serial_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedDroneForDetail.model_name}
                  </span>
                  {selectedDroneForDetail.status === "READY" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Siap Terbang
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Servis
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Buku Catatan Pemeliharaan & Perawatan Unit ({logs.filter(l => l.drone_id === selectedDroneForDetail.id).length} Riwayat)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDroneForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Drone Specific Logs */}
            {(() => {
              const droneLogs = logs.filter(l => l.drone_id === selectedDroneForDetail.id)
              if (droneLogs.length === 0) {
                return (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <History className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Belum ada catatan riwayat perawatan untuk unit drone ini.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = selectedDroneForDetail.id
                        setSelectedDroneForDetail(null)
                        openAddLogModal(targetId)
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1F77C5] text-white text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat Servis Pertama</span>
                    </button>
                  </div>
                )
              }

              return (
                <div className="space-y-3 divide-y divide-slate-100">
                  {droneLogs.map(item => {
                    const dateObj = typeof item.maintenance_date === "string" ? new Date(item.maintenance_date) : item.maintenance_date
                    return (
                      <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {formatDateWIB(dateObj, { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-600">
                              {item.maintenance_type === "INSPECTION" ? "🔍 Inspeksi" : item.maintenance_type === "REPAIR" ? "🛠️ Perbaikan" : "🔄 Pergantian"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Oleh: <strong className="text-slate-700">{item.user.full_name}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                            <span className="font-bold text-amber-800 text-[10px] uppercase block mb-0.5">Kendala:</span>
                            <p className="text-slate-700 break-words">{item.issue_indication}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                            <span className="font-bold text-[#1F77C5] text-[10px] uppercase block mb-0.5">Penanganan:</span>
                            <p className="text-slate-700 break-words">{item.action_taken}</p>
                          </div>
                        </div>

                        {item.additional_notes && (
                          <p className="text-[11px] text-slate-500 italic pl-1">
                            Catatan: {item.additional_notes}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDroneForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetId = selectedDroneForDetail.id
                  setSelectedDroneForDetail(null)
                  openAddLogModal(targetId)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F77C5] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Servis Unit Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. MODAL POP-UP KONFIRMASI HAPUS LOG SERVIS */}
      {/* ---------------------------------------------------- */}
      {logToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingLog) {
              setLogToDelete(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Hapus Catatan Servis?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan servis untuk drone{" "}
                  <strong className="text-slate-800 font-mono">{logToDelete.drone.serial_number}</strong>?
                </p>
              </div>
            </div>

            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-2 bg-rose-50/80 px-3 py-2 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Tindakan ini bersifat permanen dan data log tidak dapat dipulihkan.</span>
            </div>

            {deleteLogError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {deleteLogError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingLog}
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingLog}
                onClick={handleConfirmDeleteLog}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isDeletingLog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeletingLog ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. MODAL POP-UP KONFIRMASI HAPUS DRONE */}
      {/* ---------------------------------------------------- */}
      {droneToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingDrone) {
              setDroneToDelete(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Hapus Unit Drone dari Armada?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus drone{" "}
                  <strong className="text-slate-800 font-mono">{droneToDelete.serial_number}</strong> ({droneToDelete.model_name})?
                </p>
              </div>
            </div>

            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-2 bg-rose-50/80 px-3 py-2 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Semua riwayat pemeliharaan drone ini juga akan terhapus secara permanen.</span>
            </div>

            {deleteDroneError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {deleteDroneError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingDrone}
                onClick={() => setDroneToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingDrone}
                onClick={handleConfirmDeleteDrone}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isDeletingDrone && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeletingDrone ? "Menghapus..." : "Ya, Hapus Unit"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
