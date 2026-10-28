"use server"

import { prisma as db } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

export async function getClients() {
  try {
    const clients = await db.user.findMany({
      where: { role: Role.GUEST },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    })
    return { success: true, data: clients }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil data klien" }
  }
}

export async function createClient(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!fullName || !email || !password) {
      return { success: false, error: "Semua kolom wajib diisi" }
    }

    // Cek apakah email sudah ada
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar di sistem" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await db.user.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
        role: Role.GUEST,
        is_active: true,
      },
    })

    revalidatePath("/admin/clients")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat menambahkan akun klien" }
  }
}

export async function updateClient(id: string, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string

    if (!fullName || !email) {
      return { success: false, error: "Nama dan Email wajib diisi" }
    }

    // Cek apakah email baru sudah digunakan oleh akun lain
    const existingUser = await db.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    })
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar pada akun lain" }
    }

    const updateData: any = {
      full_name: fullName,
      email,
    }

    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    await db.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/clients")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui akun klien" }
  }
}

export async function toggleClientStatus(id: string, currentStatus: boolean) {
  try {
    await db.user.update({
      where: { id },
      data: {
        is_active: !currentStatus,
      },
    })

    revalidatePath("/admin/clients")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat memperbarui status klien" }
  }
}
