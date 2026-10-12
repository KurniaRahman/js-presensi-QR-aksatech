import { prisma as db } from "./prisma"

// Koordinat Resmi Kantor PT Aksa Tech (Default Fallback)
// Google Maps: https://maps.app.goo.gl/3m9jLVKj4uLjdYFK8
export const DEFAULT_OFFICE_COORDINATES = {
  latitude: -7.877989458768671,
  longitude: 110.31851240674597,
  radiusMeters: 100, // 100 meter toleransi radius satelit GPS
  name: "PT Aksa Tech Indonesia"
}

/**
 * Menghitung jarak antara 2 titik koordinat (dalam satuan meter) menggunakan Haversine Formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radius bumi dalam meter
  const toRad = (value: number) => (value * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Pembulatan 1 desimal
}

/**
 * Mengambil konfigurasi Geofence kantor dari database (SystemSetting)
 * dengan fallback ke nilai default jika belum diatur di database.
 */
export async function getOfficeGeofenceConfig() {
  try {
    const settings = await db.systemSetting.findMany({
      where: {
        key: {
          in: ['OFFICE_LATITUDE', 'OFFICE_LONGITUDE', 'OFFICE_RADIUS_METERS']
        }
      }
    })

    const map = new Map(settings.map(s => [s.key, s.value]))

    const latStr = map.get('OFFICE_LATITUDE')
    const lngStr = map.get('OFFICE_LONGITUDE')
    const radStr = map.get('OFFICE_RADIUS_METERS')

    const latitude = latStr ? parseFloat(latStr) : DEFAULT_OFFICE_COORDINATES.latitude
    const longitude = lngStr ? parseFloat(lngStr) : DEFAULT_OFFICE_COORDINATES.longitude
    const radiusMeters = radStr ? parseFloat(radStr) : DEFAULT_OFFICE_COORDINATES.radiusMeters

    return {
      latitude: isNaN(latitude) ? DEFAULT_OFFICE_COORDINATES.latitude : latitude,
      longitude: isNaN(longitude) ? DEFAULT_OFFICE_COORDINATES.longitude : longitude,
      radiusMeters: isNaN(radiusMeters) ? DEFAULT_OFFICE_COORDINATES.radiusMeters : radiusMeters,
      name: DEFAULT_OFFICE_COORDINATES.name
    }
  } catch (err) {
    console.error("Gagal membaca setting geofence dari database, menggunakan default:", err)
    return DEFAULT_OFFICE_COORDINATES
  }
}

/**
 * Memvalidasi apakah posisi pengguna berada dalam radius kantor Aksa Tech
 */
export async function validateUserOfficeLocation(userLat: number, userLng: number) {
  const config = await getOfficeGeofenceConfig()
  const distance = calculateDistanceMeters(
    userLat,
    userLng,
    config.latitude,
    config.longitude
  )

  const isAllowed = distance <= config.radiusMeters

  return {
    allowed: isAllowed,
    distanceMeters: distance,
    allowedRadiusMeters: config.radiusMeters,
    officeLat: config.latitude,
    officeLng: config.longitude,
    officeName: config.name
  }
}
