"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UserFormDialog } from "./user-form-dialog"
import { toggleUserStatus } from "./actions"
import { Edit, UserX, UserCheck, Plus, Filter, RotateCcw, Search, Mail, Shield, User as UserIcon } from "lucide-react"

type User = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: Date
}

export function UserTable({ users }: { users: User[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [isToggleLoading, setIsToggleLoading] = useState(false)

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [mobileSearch, setMobileSearch] = useState("")

  const openAddForm = () => {
    setUserToEdit(null)
    setIsFormOpen(true)
  }

  const openEditForm = (user: User) => {
    setUserToEdit(user)
    setIsFormOpen(true)
  }

  const handleToggleStatus = async () => {
    if (!userToToggle) return
    setIsToggleLoading(true)
    await toggleUserStatus(userToToggle.id, userToToggle.is_active)
    setIsToggleLoading(false)
    setUserToToggle(null)
  }

  const resetFilters = () => {
    setRoleFilter("ALL")
    setStatusFilter("ALL")
    setMobileSearch("")
  }

  // Filter users based on role and status (and mobileSearch for cards)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false
      if (statusFilter === "ACTIVE" && !user.is_active) return false
      if (statusFilter === "INACTIVE" && user.is_active) return false
      if (mobileSearch) {
        const query = mobileSearch.toLowerCase()
        const matchName = user.full_name.toLowerCase().includes(query)
        const matchEmail = user.email.toLowerCase().includes(query)
        if (!matchName && !matchEmail) return false
      }
      return true
    })
  }, [users, roleFilter, statusFilter, mobileSearch])

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Nama Pengguna",
      cell: ({ row }) => {
        const user = row.original
        const initials = user.full_name
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
                {user.full_name}
              </div>
              <div className="text-slate-400 text-xs font-mono">
                ID: {user.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "email",
      header: "Email Akun",
      cell: ({ row }) => (
        <span className="text-slate-600 font-mono text-xs flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {row.original.email}
        </span>
      )
    },
    {
      accessorKey: "role",
      header: "Peran (Role)",
      cell: ({ row }) => {
        const role = row.original.role
        const badgeClasses = 
          role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" :
          role === "PM" ? "bg-blue-50 text-blue-700 border-blue-200" :
          "bg-slate-100 text-slate-700 border-slate-200"
        
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClasses}`}>
            <Shield className="w-3 h-3" />
            {role === "PM" ? "Project Manager" : role}
          </span>
        )
      }
    },
    {
      accessorKey: "is_active",
      header: "Status Akun",
      cell: ({ row }) => (
        row.original.is_active ? (
          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            ● Aktif
          </span>
        ) : (
          <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            ○ Nonaktif
          </span>
        )
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex justify-end gap-1.5">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openEditForm(user)}
              className="h-8 w-8 p-0 text-[#1F77C5] hover:text-[#155b99] hover:bg-blue-50 border-slate-200 rounded-lg transition-colors"
              title="Edit Pengguna"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setUserToToggle(user)}
              className={`h-8 w-8 p-0 rounded-lg border-slate-200 transition-colors ${
                user.is_active 
                  ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" 
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
              title={user.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
            >
              {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )
      }
    }
  ], [])

  const filterControls = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center space-x-1.5">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#1F77C5] cursor-pointer font-medium"
        >
          <option value="ALL">Semua Role</option>
          <option value="ADMIN">Admin</option>
          <option value="PM">Project Manager (PM)</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#1F77C5] cursor-pointer font-medium"
      >
        <option value="ALL">Semua Status</option>
        <option value="ACTIVE">Aktif Saja</option>
        <option value="INACTIVE">Nonaktif Saja</option>
      </select>

      {(roleFilter !== "ALL" || statusFilter !== "ALL" || mobileSearch) && (
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
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Daftar Akun Karyawan</h2>
          <span className="text-xs bg-blue-50 text-[#1F77C5] font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
            {filteredUsers.length} Total
          </span>
        </div>
        <Button 
          onClick={openAddForm} 
          className="bg-gradient-to-r from-[#103D6D] to-[#1F77C5] hover:from-[#0B2545] hover:to-[#155b99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable 
          columns={columns} 
          data={filteredUsers} 
          searchPlaceholder="Cari nama atau email pengguna..."
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
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400 text-sm shadow-sm">
            Tidak ada pengguna yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map((user) => {
              const initials = user.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#103D6D] to-[#1F77C5] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{user.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    {user.is_active ? (
                      <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0">
                        ● Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0">
                        ○ Nonaktif
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        user.role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        user.role === "PM" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role === "PM" ? "Project Manager" : user.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(user)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#1F77C5] hover:bg-blue-100 font-semibold text-xs border border-blue-200/60 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setUserToToggle(user)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs border transition-colors flex items-center gap-1 ${
                          user.is_active
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>{user.is_active ? "Nonaktifkan" : "Aktifkan"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <UserFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        userToEdit={userToEdit} 
      />

      {/* Confirmation Toggle Status Dialog */}
      <AlertDialog open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-800">
              {userToToggle?.is_active ? "Nonaktifkan Pengguna?" : "Aktifkan Pengguna?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {userToToggle?.is_active 
                ? `Apakah Anda yakin ingin menonaktifkan akun ${userToToggle?.full_name}? Mereka tidak akan bisa login lagi ke dalam sistem.`
                : `Apakah Anda yakin ingin mengaktifkan kembali akun ${userToToggle?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              className={`rounded-xl font-semibold text-xs sm:text-sm text-white ${
                userToToggle?.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={handleToggleStatus}
            >
              {isToggleLoading ? "Memproses..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
