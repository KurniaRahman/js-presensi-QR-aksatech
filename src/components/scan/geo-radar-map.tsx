"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { 
  DEFAULT_OFFICE_COORDINATES, 
  calculateDistanceMeters 
} from "@/lib/geo-utils"
import { 
  Navigation, 
  RotateCw, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Compass, 
  Building2, 
  ExternalLink,
  Smartphone,
  Info
} from "lucide-react"

export interface GeoLocationState {
  latitude: number
  longitude: number
  accuracy: number
  distance: number
  isInside: boolean
}

interface GeoRadarMapProps {
  onLocationChange?: (state: GeoLocationState | null) => void
  onPermissionChange?: (isGranted: boolean) => void
}

export function GeoRadarMap({
  onLocationChange,
  onPermissionChange,
}: GeoRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<{
    officeMarker?: any
    userMarker?: any
    circle?: any
    polyline?: any
  }>({})

  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D")
  const [gpsStatus, setGpsStatus] = useState<
    "PROMPT" | "ACQUIRING" | "READY" | "DENIED" | "UNSUPPORTED" | "ERROR"
  >("ACQUIRING")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [userLocation, setUserLocation] = useState<GeoLocationState | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const officeLat = DEFAULT_OFFICE_COORDINATES.latitude
  const officeLng = DEFAULT_OFFICE_COORDINATES.longitude
  const officeRadius = DEFAULT_OFFICE_COORDINATES.radiusMeters

  // Fungsi untuk menangani pembaruan lokasi dari browser Geolocation API
  const handlePositionSuccess = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords
      const distance = calculateDistanceMeters(
        latitude,
        longitude,
        officeLat,
        officeLng
      )
      const isInside = distance <= officeRadius

      const state: GeoLocationState = {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        distance,
        isInside,
      }

      setUserLocation(state)
      setGpsStatus("READY")
      setIsRefreshing(false)
      onLocationChange?.(state)
      onPermissionChange?.(true)
    },
    [officeLat, officeLng, officeRadius, onLocationChange, onPermissionChange]
  )

  const handlePositionError = useCallback(
    (err: GeolocationPositionError) => {
      setIsRefreshing(false)
      onLocationChange?.(null)
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus("DENIED")
        setErrorMessage("Akses izin lokasi ditolak. Harap izinkan akses GPS di pengaturan browser Anda.")
        onPermissionChange?.(false)
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setGpsStatus("ERROR")
        setErrorMessage("Sinyal GPS tidak tersedia atau perangkat tidak dapat mendeteksi lokasi saat ini.")
      } else if (err.code === err.TIMEOUT) {
        setGpsStatus("ERROR")
        setErrorMessage("Waktu permintaan lokasi habis (timeout). Silakan coba lagi.")
      } else {
        setGpsStatus("ERROR")
        setErrorMessage(err.message || "Gagal mendapatkan lokasi.")
      }
    },
    [onLocationChange, onPermissionChange]
  )

  // Request posisi pengguna dari peramban
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("UNSUPPORTED")
      setErrorMessage("Browser Anda tidak mendukung fitur Geolocation GPS.")
      return
    }

    setIsRefreshing(true)
    setGpsStatus("ACQUIRING")

    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [handlePositionSuccess, handlePositionError])

  // Inisialisasi awal saat komponen dimount
  useEffect(() => {
    requestLocation()

    // Pasang watchPosition agar posisi terupdate otomatis saat pengguna bergerak
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        () => {}, // Jangan timpa error saat watch background gagal
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        }
      )
      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [requestLocation, handlePositionSuccess])

  // Inisialisasi & Update Peta Leaflet
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return

    let isMounted = true

    // Dynamic import leaflet untuk mencegah masalah SSR
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return

      // Inisialisasi Map jika belum ada
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [officeLat, officeLng],
          zoom: 17,
          zoomControl: false,
          attributionControl: false,
        })

        // Tile layer OpenStreetMap 100% GRATIS & TANPA PERLU API KEY
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            subdomains: ["a", "b", "c"],
          }
        ).addTo(map)

        // Custom DivIcon Kantor Aksa Tech
        const officeIcon = L.divIcon({
          className: "custom-office-pin",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: linear-gradient(135deg, #0B2545, #1F77C5); color: white; padding: 6px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 14px rgba(31,119,197,0.35); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
                <span>🏢 Aksa Tech</span>
              </div>
              <div style="width: 14px; height: 14px; background: #1F77C5; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-top: -2px;"></div>
            </div>
          `,
          iconSize: [0, 0],
        })

        const officeMarker = L.marker([officeLat, officeLng], { icon: officeIcon }).addTo(map)
        officeMarker.bindPopup("<b>PT Aksa Tech Indonesia</b><br>Titik Pusat Presensi")

        // Geofence Circle Radius
        const circle = L.circle([officeLat, officeLng], {
          radius: officeRadius,
          color: "#1F77C5",
          fillColor: "#1F77C5",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "6, 6",
        }).addTo(map)

        mapInstanceRef.current = map
        markersRef.current.officeMarker = officeMarker
        markersRef.current.circle = circle
      }

      const map = mapInstanceRef.current
      if (!map) return

      // Update User Marker jika lokasi sudah terdeteksi
      if (userLocation) {
        const { latitude, longitude, isInside, distance } = userLocation

        // Warna tema status: Hijau jika dalam radius, Merah/Oranye jika di luar
        const themeColor = isInside ? "#10B981" : "#EF4444"
        const statusLabel = isInside ? "Di Area Kantor" : "Di Luar Radius"

        // Update Circle Geofence warna sesuai status
        if (markersRef.current.circle) {
          markersRef.current.circle.setStyle({
            color: isInside ? "#10B981" : "#EF4444",
            fillColor: isInside ? "#10B981" : "#EF4444",
            fillOpacity: isInside ? 0.16 : 0.08,
          })
        }

        // Custom DivIcon User dengan animasi radar pulse
        const userIcon = L.divIcon({
          className: "custom-user-beacon",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
              <div style="position: absolute; width: 44px; height: 44px; background: ${themeColor}; border-radius: 50%; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; background: ${themeColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10; display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
              </div>
              <div style="position: absolute; top: 26px; background: white; color: #1E293B; border: 1px solid ${themeColor}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                ${statusLabel} (${distance}m)
              </div>
            </div>
          `,
          iconSize: [0, 0],
        })

        if (markersRef.current.userMarker) {
          markersRef.current.userMarker.setLatLng([latitude, longitude])
          markersRef.current.userMarker.setIcon(userIcon)
        } else {
          markersRef.current.userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
        }

        // Garis Polyline menghubungkan User & Kantor
        if (markersRef.current.polyline) {
          markersRef.current.polyline.setLatLngs([
            [officeLat, officeLng],
            [latitude, longitude],
          ])
          markersRef.current.polyline.setStyle({
            color: themeColor,
          })
        } else {
          markersRef.current.polyline = L.polyline(
            [
              [officeLat, officeLng],
              [latitude, longitude],
            ],
            {
              color: themeColor,
              weight: 2,
              dashArray: "5, 8",
              opacity: 0.8,
            }
          ).addTo(map)
        }

        // Sesuaikan pandangan kamera agar mencakup kantor dan posisi pengguna
        const bounds = L.latLngBounds([
          [officeLat, officeLng],
          [latitude, longitude],
        ])
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 })
      }
    })

    return () => {
      isMounted = false
    }
  }, [officeLat, officeLng, officeRadius, userLocation])

  return (
    <div className="w-full space-y-3">
      {/* 1. Header Banner & Status Indikator Lokasi */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
              gpsStatus === "ACQUIRING"
                ? "bg-blue-50 text-[#1F77C5]"
                : userLocation?.isInside
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : gpsStatus === "DENIED" || gpsStatus === "ERROR"
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}
          >
            {gpsStatus === "ACQUIRING" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : userLocation?.isInside ? (
              <ShieldCheck className="w-5 h-5" />
            ) : gpsStatus === "DENIED" ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Status GPS & Geofencing
              </span>
              {userLocation && (
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    userLocation.isInside
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {userLocation.isInside ? "Dalam Radius" : "Di Luar Jangkauan"}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {gpsStatus === "ACQUIRING" && "Mendeteksi koordinat GPS perangkat Anda..."}
              {gpsStatus === "DENIED" && "Akses lokasi diblokir. Harap aktifkan izin lokasi."}
              {gpsStatus === "ERROR" && errorMessage}
              {gpsStatus === "READY" && userLocation && (
                <>
                  Jarak ke kantor:{" "}
                  <strong
                    className={`font-mono ${
                      userLocation.isInside ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {userLocation.distance.toLocaleString("id-ID")} meter
                  </strong>{" "}
                  (Batas aman: {officeRadius} m)
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh GPS & Toggle 3D View */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "3D" ? "2D" : "3D"))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              viewMode === "3D"
                ? "bg-[#1F77C5] text-white border-[#1F77C5] shadow-blue-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Ubah sudut pandang peta antara 3D Isometric dan 2D Standar"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mode {viewMode}</span>
          </button>

          <button
            type="button"
            onClick={requestLocation}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#1F77C5] hover:border-[#1F77C5] hover:bg-blue-50/50 shadow-2xs transition-all disabled:opacity-50"
            title="Segarkan posisi GPS terkini"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Error / Warning Alert Banner (Jika Ditolak atau di Luar Radius) */}
      {gpsStatus === "DENIED" && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Izin Akses Lokasi Diperlukan untuk Presensi</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            Sistem membutuhkan koordinat GPS untuk memvalidasi bahwa Anda berada di area kantor PT Aksa Tech.
            Silakan klik ikon gembok / setelan di bilah alamat browser Anda dan ubah izin <strong>Lokasi</strong> menjadi <strong>Izinkan (Allow)</strong>, kemudian tekan tombol segarkan di atas.
          </p>
        </div>
      )}

      {userLocation && !userLocation.isInside && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-3 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>Terdeteksi di Luar Radius Kantor ({userLocation.distance.toLocaleString("id-ID")} meter)</span>
            </div>
            <div className="text-[11px] font-mono text-amber-700 font-semibold">
              Batas Toleransi: {officeRadius} m
            </div>
          </div>

          {/* Kotak Informasi & Panduan Penggunaan Smartphone */}
          <div className="p-3 rounded-xl bg-white/80 border border-amber-200/80 text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">
                  Perhatian bagi Pengguna Laptop / Komputer:
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Perangkat Laptop atau PC tidak memiliki sensor satelit GPS fisik. Browser menentukan lokasi berdasarkan perkiraan IP provider internet yang dapat meleset beberapa kilometer.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2 border-t border-amber-100">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Saran Presensi:
              </span>
              <span className="text-[11px] text-slate-600">
                Gunakan <strong>Smartphone (HP)</strong> dengan GPS aktif saat presensi agar posisi terdeteksi akurat di dalam area kantor.
              </span>
            </div>
          </div>

          {/* Rincian Koordinat Klien */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 pt-1">
            <div className="p-2 rounded-lg bg-amber-100/50">
              <span className="text-slate-500">Koordinat Anda:</span>{" "}
              <strong className="text-slate-900">
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-amber-100/50">
              <span className="text-slate-500">Estimasi Akurasi:</span>{" "}
              <strong className="text-slate-900">±{userLocation.accuracy} meter</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. 3D Perspective Map Container (Bebas Watermark & 100% Free OpenStreetMap) */}
      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200/90 shadow-lg bg-slate-900 group">
        
        {/* Subtle Tech Grid / Radar Overlay Elements */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] font-extrabold text-slate-800 flex items-center gap-1.5 shadow-xs">
            <Compass className="w-3 h-3 text-[#1F77C5] animate-spin-slow" />
            <span>RADAR 3D GEOFENCE</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-[400]">
          <a
            href="https://maps.app.goo.gl/3m9jLVKj4uLjdYFK8"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] font-bold text-slate-700 hover:text-[#1F77C5] flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Buka Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Wadah Peta dengan Efek 3D Transform */}
        <div
          style={{
            perspective: "1000px",
            perspectiveOrigin: "50% 50%",
          }}
          className="w-full h-60 sm:h-72 lg:h-[300px] overflow-hidden flex items-center justify-center bg-slate-100"
        >
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "100%",
              transform:
                viewMode === "3D"
                  ? "rotateX(26deg) rotateZ(-2deg) scale(1.08)"
                  : "none",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="w-full h-full"
          />
        </div>

        {/* Ambient Overlay Vignette & Corner Accents */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.12)]"></div>
        <div className="absolute bottom-2 left-3 right-3 z-[400] flex items-center justify-between text-[10px] text-slate-600 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 pointer-events-none">
          <div className="flex items-center gap-1 font-semibold truncate">
            <Building2 className="w-3 h-3 text-[#1F77C5] flex-shrink-0" />
            <span className="truncate">PT Aksa Tech (Bantul, D.I. Yogyakarta)</span>
          </div>
          <div className="font-mono text-slate-500 font-bold flex-shrink-0 pl-2">
            R = {officeRadius}m
          </div>
        </div>
      </div>
    </div>
  )
}
