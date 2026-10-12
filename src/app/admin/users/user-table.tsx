"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UserFormDialog } from "./user-form-dialog"
import { toggleUserStatus } from "./actions"
import { Edit, UserX, UserCheck, Plus, Filter, RotateCcw } from "lucide-react"

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
  }

  // Filter users based on role and status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false
      if (statusFilter === "ACTIVE" && !user.is_active) return false
      if (statusFilter === "INACTIVE" && user.is_active) return false
      return true
    })
  }, [users, roleFilter, statusFilter])

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Nama Lengkap",
      cell: ({ row }) => (
        <div className="font-semibold text-slate-800">
          {row.original.full_name}
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-slate-600 font-mono text-xs">
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
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}`}>
            {role}
          </span>
        )
      }
    },
    {
      accessorKey: "is_active",
      header: "Status Akun",
      cell: ({ row }) => (
        row.original.is_active ? (
          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
            ● Aktif
          </span>
        ) : (
          <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
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
              className="h-8 w-8 p-0 text-[#1F77C5] hover:text-[#155b99] hover:bg-blue-50 border-slate-200 rounded-lg"
              title="Edit Pengguna"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setUserToToggle(user)}
              className={`h-8 w-8 p-0 rounded-lg border-slate-200 ${
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

      {(roleFilter !== "ALL" || statusFilter !== "ALL") && (
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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-800">Daftar Pengguna</h2>
          <span className="text-xs bg-blue-50 text-[#1F77C5] font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
            {filteredUsers.length} Total
          </span>
        </div>
        <Button onClick={openAddForm} className="bg-[#1F77C5] hover:bg-[#155b99] rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        searchPlaceholder="Cari nama atau email..."
        filterControls={filterControls}
      />

      <UserFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        userToEdit={userToEdit} 
      />

      <AlertDialog open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.is_active ? "Nonaktifkan Pengguna?" : "Aktifkan Pengguna?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.is_active 
                ? `Apakah Anda yakin ingin menonaktifkan akun ${userToToggle?.full_name}? Mereka tidak akan bisa login lagi ke dalam sistem.`
                : `Apakah Anda yakin ingin mengaktifkan kembali akun ${userToToggle?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction 
              className={`rounded-xl ${userToToggle?.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
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
