"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser, updateUser } from "./actions"
import { Loader2, UserPlus, UserCog, ShieldCheck } from "lucide-react"

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
    setError(null)
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
      setError("Terjadi kesalahan jaringan saat menyimpan data.")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xl relative max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Top Stripe Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />

          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-blue-50 text-[#1F77C5] border border-blue-100">
                {userToEdit ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </span>
              <DialogTitle className="text-xl font-extrabold text-slate-800">
                {userToEdit ? "Perbarui Data Karyawan" : "Tambah Karyawan Baru"}
              </DialogTitle>
            </div>
            <p className="text-xs text-slate-500">
              {userToEdit 
                ? "Ubah informasi profil, peran, atau reset kata sandi akun karyawan." 
                : "Daftarkan akun karyawan baru ke dalam sistem HRIS Aksa Tech."}
            </p>
          </DialogHeader>
          
          <form onSubmit={onSubmitRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Lengkap</label>
              <Input 
                name="fullName" 
                defaultValue={userToEdit?.full_name} 
                required 
                placeholder="Contoh: Budi Santoso"
                className="rounded-xl border-slate-200 focus:border-[#1F77C5] text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Perusahaan</label>
              <Input 
                name="email" 
                type="email" 
                defaultValue={userToEdit?.email} 
                disabled={!!userToEdit} 
                required 
                placeholder="nama@aksatech.com"
                className={`rounded-xl border-slate-200 text-sm ${userToEdit ? 'bg-slate-50 text-slate-500 font-mono' : 'focus:border-[#1F77C5]'}`}
              />
              {userToEdit && (
                <p className="text-[11px] text-slate-400">Email akun tidak dapat diubah setelah terdaftar.</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Peran (Role)</label>
              <Select value={role} onValueChange={(val) => val && setRole(val)}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-sm focus:border-[#1F77C5] bg-white">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent className="w-[var(--anchor-width)] min-w-[220px] rounded-2xl border-slate-200 shadow-xl bg-white p-1">
                  <SelectItem value="ADMIN" className="rounded-lg text-sm font-medium cursor-pointer">
                    Admin
                  </SelectItem>
                  <SelectItem value="PM" className="rounded-lg text-sm font-medium cursor-pointer">
                    Project Manager
                  </SelectItem>
                  <SelectItem value="STAFF" className="rounded-lg text-sm font-medium cursor-pointer">
                    Staff
                  </SelectItem>
                  <SelectItem value="MAGANG" className="rounded-lg text-sm font-medium cursor-pointer">
                    Magang
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {userToEdit ? "Password Baru (Opsional)" : "Password Akun"}
              </label>
              <Input 
                name="password" 
                type="password" 
                required={!userToEdit} 
                placeholder={userToEdit ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
                className="rounded-xl border-slate-200 focus:border-[#1F77C5] text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {userToEdit ? "Konfirmasi Password Baru" : "Konfirmasi Password"}
              </label>
              <Input 
                name="confirmPassword" 
                type="password" 
                required={!userToEdit} 
                placeholder="Ulangi password di atas"
                className="rounded-xl border-slate-200 focus:border-[#1F77C5] text-sm"
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}
            
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-[#103D6D] to-[#1F77C5] hover:from-[#0B2545] hover:to-[#155b99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  userToEdit ? "Simpan Perubahan" : "Daftarkan Pengguna"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Update Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] via-[#1F77C5] to-sky-400" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-800">
              Konfirmasi Pembaruan Data
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Apakah Anda yakin ingin memperbarui data pengguna ini? Perubahan akan langsung berdampak pada sesi berikutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-gradient-to-r from-[#103D6D] to-[#1F77C5] hover:from-[#0B2545] hover:to-[#155b99] text-white rounded-xl text-xs sm:text-sm font-semibold"
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
