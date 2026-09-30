"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UserFormDialog } from "./user-form-dialog"
import { toggleUserStatus } from "./actions"
import { Edit, UserX, UserCheck, Plus } from "lucide-react"

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

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Nama",
      cell: ({ row }) => <div className="font-medium">{row.original.full_name}</div>
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {row.original.role}
        </span>
      )
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        row.original.is_active ? (
          <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">Aktif</span>
        ) : (
          <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">Nonaktif</span>
        )
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openEditForm(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant={user.is_active ? "destructive" : "outline"}
              size="sm"
              onClick={() => setUserToToggle(user)}
            >
              {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        )
      }
    }
  ], [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Daftar Pengguna</h2>
        <Button onClick={openAddForm} className="bg-[#1F77C5] hover:bg-[#155b99]">
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={users} 
        searchPlaceholder="Cari nama atau email pengguna..."
      />

      <UserFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        userToEdit={userToEdit} 
      />

      <AlertDialog open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
        <AlertDialogContent>
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
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              className={userToToggle?.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
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
