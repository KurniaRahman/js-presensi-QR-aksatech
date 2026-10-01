"use server"

import { headers } from "next/headers"
import { prisma as db } from "@/lib/prisma"

export async function checkNetworkIp() {
  const reqHeaders = await headers()
  const ip = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1'
  
  // Ambil setting IP dari database
  let allowedIpSetting = await db.systemSetting.findUnique({
    where: { key: 'OFFICE_WIFI_IP' }
  })

  if (!allowedIpSetting) {
    // Jika belum ada di DB, buat default sesuai kesepakatan (localhost/127.0.0.1 diizinkan)
    allowedIpSetting = await db.systemSetting.create({
      data: {
        key: 'OFFICE_WIFI_IP',
        value: '192.250.1.1, ::1'
      }
    })
  }

  const allowedIps = allowedIpSetting.value.split(',').map(s => s.trim())
  
  // x-forwarded-for kadang berisi beberapa IP jika melewati banyak proxy, kita ambil yang pertama (IP Klien)
  const clientIp = ip.split(',')[0].trim()

  return {
    allowed: allowedIps.includes(clientIp),
    clientIp
  }
}
