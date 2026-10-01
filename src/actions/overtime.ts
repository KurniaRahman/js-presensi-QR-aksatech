"use server"

import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateOvertimeStatus(id: string, newStatus: 'APPROVED' | 'REJECTED') {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "PM") {
    return { success: false, message: "Access denied" }
  }

  try {
    await db.overtime.update({
      where: { id },
      data: {
        status: newStatus,
        approved_by: session.user.id
      }
    })

    revalidatePath("/admin/overtime")
    revalidatePath("/pm/overtime")
    revalidatePath("/dashboard") // For user dashboard
    
    return { success: true, message: `Lembur berhasil di-${newStatus}` }
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memperbarui status" }
  }
}
