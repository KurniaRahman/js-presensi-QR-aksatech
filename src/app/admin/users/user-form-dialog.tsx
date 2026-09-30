"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser, updateUser } from "./actions"

type User = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
}

export function UserFormDialog({ 
  open, 
  onOpenChange, 
  userToEdit 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  userToEdit?: User | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState("STAFF")
  const [showConfirm, setShowConfirm] = useState(false)
  const [formDataCache, setFormDataCache] = useState<FormData | null>(null)

  useEffect(() => {
    if (userToEdit) {
      setRole(userToEdit.role)
    } else {
      setRole("STAFF")
    }
  }, [userToEdit, open])

  const onSubmitRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("role", role)
    
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    
    if (password && password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok")
      return
    }

    if (userToEdit) {
      setFormDataCache(formData)
      setShowConfirm(true)
    } else {
      executeSubmit(formData)
    }
  }

  const executeSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    try {
      let res
      if (userToEdit) {
        res = await updateUser(userToEdit.id, formData)
      } else {
        res = await createUser(formData)
      }
      
      if (res.error) {
        setError(res.error)
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userToEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={onSubmitRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input name="fullName" defaultValue={userToEdit?.full_name} required />
            </div>
            
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" defaultValue={userToEdit?.email} disabled={!!userToEdit} required />
            </div>
            
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(val) => val && setRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="PM">Project Manager (PM)</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">
                {userToEdit ? "Password Baru (Kosongkan jika tidak ingin diubah)" : "Password"}
              </label>
              <Input name="password" type="password" required={!userToEdit} />
            </div>
            
            <div>
              <label className="text-sm font-medium">
                {userToEdit ? "Konfirmasi Password Baru" : "Konfirmasi Password"}
              </label>
              <Input name="confirmPassword" type="password" required={!userToEdit} />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" className="bg-[#1F77C5] hover:bg-[#155b99]" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembaruan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memperbarui data pengguna ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-[#1F77C5] hover:bg-[#155b99]"
              onClick={() => formDataCache && executeSubmit(formDataCache)}
            >
              Ya, Perbarui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
