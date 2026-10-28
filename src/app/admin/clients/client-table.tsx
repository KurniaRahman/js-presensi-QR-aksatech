"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClientFormDialog } from "./client-form-dialog"
import { toggleClientStatus } from "./actions"
import { Edit, UserX, UserCheck, Plus, Filter, RotateCcw, Search, Mail, Shield } from "lucide-react"

type Client = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: Date
}

export function ClientTable({ clients }: { clients: Client[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)

  const [clientToToggle, setClientToToggle] = useState<Client | null>(null)
  const [isToggleLoading, setIsToggleLoading] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [mobileSearch, setMobileSearch] = useState("")

  const openAddForm = () => {
    setClientToEdit(null)
    setIsFormOpen(true)
  }

  const openEditForm = (client: Client) => {
    setClientToEdit(client)
    setIsFormOpen(true)
  }

  const handleToggleStatus = async () => {
    if (!clientToToggle) return
    setIsToggleLoading(true)
    await toggleClientStatus(clientToToggle.id, clientToToggle.is_active)
    setIsToggleLoading(false)
    setClientToToggle(null)
  }

  const resetFilters = () => {
    setStatusFilter("ALL")
    setMobileSearch("")
  }

  // Filter clients based on status and mobileSearch
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (statusFilter === "ACTIVE" && !client.is_active) return false
      if (statusFilter === "INACTIVE" && client.is_active) return false
      if (mobileSearch) {
        const query = mobileSearch.toLowerCase()
        const matchName = client.full_name.toLowerCase().includes(query)
        const matchEmail = client.email.toLowerCase().includes(query)
        if (!matchName && !matchEmail) return false
      }
      return true
    })
  }, [clients, statusFilter, mobileSearch])

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: "Nama Pengguna",
        cell: ({ row }) => {
          const client = row.original
          const initials = client.full_name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()

          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#103D6D] to-[#1F77C5] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">
                  {client.full_name}
                </div>
                <div className="text-slate-400 text-xs font-mono">
                  ID: {client.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email Akun",
        cell: ({ row }) => (
          <span className="text-slate-600 font-mono text-xs flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Peran (Role)",
        cell: () => (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
            <Shield className="w-3 h-3" />
            Guest (External)
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status Akun",
        cell: ({ row }) =>
          row.original.is_active ? (
            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              ● Aktif
            </span>
          ) : (
            <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              ○ Nonaktif
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditForm(client)}
                className="h-8 w-8 p-0 text-[#1F77C5] hover:text-[#155b99] hover:bg-blue-50 border-slate-200 rounded-lg transition-colors"
                title="Edit Klien"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientToToggle(client)}
                className={`h-8 w-8 p-0 rounded-lg border-slate-200 transition-colors ${
                  client.is_active
                    ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
                title={client.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
              >
                {client.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const filterControls = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center space-x-1.5">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#1F77C5] cursor-pointer font-medium"
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Aktif Saja</option>
          <option value="INACTIVE">Nonaktif Saja</option>
        </select>
      </div>

      {(statusFilter !== "ALL" || mobileSearch) && (
        <button
          onClick={resetFilters}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl transition-colors font-medium"
          title="Reset Filter"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Action Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Daftar Klien</h2>
          <span className="text-xs bg-blue-50 text-[#1F77C5] font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
            {filteredClients.length} Total
          </span>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-gradient-to-r from-[#103D6D] to-[#1F77C5] hover:from-[#0B2545] hover:to-[#155b99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Klien
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredClients}
          searchPlaceholder="Cari nama atau email klien..."
          filterControls={filterControls}
        />
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#1F77C5] bg-white"
            />
          </div>
          <div>{filterControls}</div>
        </div>

        {/* Mobile Cards List */}
        {filteredClients.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400 text-sm shadow-sm">
            Tidak ada klien yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredClients.map((client) => {
              const initials = client.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <div key={client.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#103D6D] to-[#1F77C5] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{client.full_name}</div>
                        <div className="text-slate-400 text-xs font-mono">ID: {client.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center text-slate-600 font-mono">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      {client.email}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                        <Shield className="w-3 h-3" />
                        Guest (External)
                      </span>
                      {client.is_active ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          ● Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          ○ Nonaktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(client)}
                      className="rounded-xl text-xs font-semibold h-8 border-slate-200 hover:bg-blue-50 text-[#1F77C5]"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClientToToggle(client)}
                      className={`rounded-xl text-xs font-semibold h-8 border-slate-200 ${
                        client.is_active
                          ? "hover:bg-rose-50 text-rose-600 hover:border-rose-200"
                          : "hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200"
                      }`}
                    >
                      {client.is_active ? (
                        <>
                          <UserX className="w-3.5 h-3.5 mr-1" /> Nonaktifkan
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Aktifkan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clientToEdit={clientToEdit}
      />

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!clientToToggle} onOpenChange={(open) => !open && setClientToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xl relative max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />
          <AlertDialogHeader className="space-y-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-1 ${
                clientToToggle?.is_active
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}
            >
              {clientToToggle?.is_active ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <AlertDialogTitle className="text-xl font-extrabold text-slate-800">
              {clientToToggle?.is_active ? "Nonaktifkan Akun Klien?" : "Aktifkan Akun Klien?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              {clientToToggle?.is_active
                ? `Klien "${clientToToggle.full_name}" tidak akan dapat masuk ke sistem setelah dinonaktifkan.`
                : `Klien "${clientToToggle?.full_name}" akan dapat masuk kembali ke portal tamu sistem.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel
              disabled={isToggleLoading}
              className="rounded-xl text-xs sm:text-sm font-semibold border-slate-200"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isToggleLoading}
              onClick={(e) => {
                e.preventDefault()
                handleToggleStatus()
              }}
              className={`text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md active:scale-[0.98] ${
                clientToToggle?.is_active
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
            >
              {isToggleLoading ? "Memproses..." : clientToToggle?.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
