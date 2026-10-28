"use server"

import { prisma as db } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

export async function getUsers() {
  try {
    const users = await db.user.findMany({
      where: { role: { not: 'GUEST' } },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true
      }
    })
    return { success: true, data: users }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil data pengguna" }
  }
}

export async function createUser(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as Role

    if (!fullName || !email || !password || !role) {
      return { success: false, error: "Semua kolom wajib diisi" }
    }

    // Cek apakah email sudah ada
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await db.user.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
        role,
      }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat menambahkan pengguna" }
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const role = formData.get("role") as Role
    const password = formData.get("password") as string

    if (!fullName || !email || !role) {
      return { success: false, error: "Nama, Email, dan Role wajib diisi" }
    }

    // Cek apakah email baru sudah digunakan oleh pengguna lain
    const existingUser = await db.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    })
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar pada pengguna lain" }
    }

    const updateData: any = {
      full_name: fullName,
      email,
      role,
    }

    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    await db.user.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui pengguna" }
  }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  try {
    await db.user.update({
      where: { id },
      data: {
        is_active: !currentStatus
      }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui status pengguna" }
  }
}
