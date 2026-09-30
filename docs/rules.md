# **DOKUMEN PANDUAN TEKNIS & ATURAN SISTEM (SYSTEM RULES & TECH STACK)**

**Informasi Dokumen**

* **Proyek:** Sistem Informasi Presensi & Manajemen Lembur (MVP)  
* **Perusahaan:** PT Aksa Tech  
* **Role/Target Audien:** Solo Developer / AI Code Assistant  
* **Versi Dokumen:** 1.1 (Updated with VCS & Deployment Rules)  
* **Tanggal Pembaruan:** 30 September 2026

## **1\. Pendahuluan**

Dokumen ini berfungsi sebagai instruksi mutlak (*System Prompt* & *Technical Guidelines*) untuk proses pengembangan sistem. Dokumen ini dirancang khusus untuk lingkungan kerja *Solo Developer* yang dibantu oleh AI Code Assistant. Dilarang melanggar aturan di bawah ini tanpa persetujuan eksplisit.

## **2\. Arsitektur & Tech Stack**

Sistem ini dibangun menggunakan arsitektur *Minimum Viable Product* (MVP) dengan pendekatan *Zero Cost Infrastructure*.

* **Framework Utama:** **Next.js (App Router)**. Digunakan untuk Fullstack (React UI \+ Server API) dalam satu *codebase*.  
* **Styling & UI:** **Tailwind CSS** dipadukan dengan **shadcn/ui** (dan Lucide Icons). Desain wajib merujuk pada design.md (Light mode, aksen biru \#1F77C5).  
* **Database:** **PostgreSQL** (via Supabase Free Tier).  
* **ORM (Object-Relational Mapping):** **Prisma**. Digunakan untuk interaksi dengan *database* yang *Type-Safe*.  
* **Autentikasi:** NextAuth.js (v5) atau Supabase Auth (dibatasi untuk otorisasi akses role: STAFF, PM, ADMIN).

## **3\. Standar Penulisan Kode (Coding Standards)**

* **Prinsip Dasar:** KISS (Keep It Simple, Stupid) dan DRY (Don't Repeat Yourself). Dilarang membuat abstraksi kode (*clever code*) yang tidak perlu.  
* **Penamaan Variabel & Fungsi (CamelCase):** Gunakan bahasa Indonesia profesional dan deskriptif. Contoh: hitungTotalLembur, catatPresensiMasuk.  
* **Penamaan Skema Database (Snake\_Case):** Sesuai standar SQL. Contoh: clock\_in, is\_active.  
* **Komentar Kode (Self-Documenting):** Nama fungsi harus menjelaskan "apa" yang dilakukan. Komentar hanya boleh digunakan untuk menjelaskan "mengapa" sebuah aturan bisnis (Business Rule) spesifik diterapkan (misal: "Kenapa ada delay 15 menit di sini?").  
* **Server Actions:** Utamakan penggunaan *Server Actions* bawaan Next.js App Router untuk operasi mutasi data (CRUD), kurangi pembuatan API Routes (/api/...) konvensional kecuali untuk *webhook* atau *endpoint* eksternal.

## **4\. Aturan Logika Bisnis (Mutlak)**

* **Wajib Soft Delete:** Jangan pernah menggunakan perintah DELETE pada tabel users. Selalu gunakan operasi UPDATE is\_active \= false.  
* **Cooldown Presensi:** Implementasikan pengecekan selisih waktu. Jika *scan* terakhir terjadi \< 15 menit yang lalu, abaikan/tolak *scan* berikutnya.  
* **Bypass Jaringan:** Fitur *Scan QR* harus melakukan pengecekan IP (Whitelisting). Jika IP klien tidak cocok dengan IP Router PT Aksa Tech, tombol *scan* harus di-*disable*.

## **5\. Keamanan, VCS (Git) & Protokol Deployment**

Sebagai Solo Developer, trunk-based development (fokus pada branch main) diperbolehkan, namun dengan aturan rilis yang ketat.

### **A. Aturan Version Control System (GitHub)**

1. **Conventional Commits:** Penamaan *commit* wajib menggunakan standar format agar mudah dilacak.  
   * feat: \[nama fitur\] \-\> Untuk penambahan fitur baru (contoh: feat: add QR scanner logic).  
   * fix: \[nama perbaikan\] \-\> Untuk perbaikan bug.  
   * chore: \[nama task\] \-\> Untuk pembaruan *dependency*, *setup*, atau konfigurasi.  
   * refactor: \[nama bagian\] \-\> Untuk perapihan kode tanpa mengubah fungsionalitas.  
2. **Push Berkala:** Lakukan *commit* untuk setiap fungsi/modul yang selesai. Jangan menumpuk ratusan baris kode dalam satu *commit*.

### **B. Protokol Deployment (Production)**

1. **Pengecekan Pra-Deployment (Build Check):** Dilarang keras melakukan git push ke repositori utama jika belum menjalankan pengecekan *build* di *local*.  
   * **Wajib jalankan:** npm run build di terminal lokal.  
   * Jika terdapat *error Typescript* atau *ESLint*, perbaiki terlebih dahulu. Jangan biarkan CI/CD di *server* (misal Vercel) gagal karena kelalaian *local build*.  
2. **Manajemen Environment Variables (ENV):**  
   * Dilarang keras menaruh URL Database, Secret Key, atau kredensial apa pun secara langsung di dalam kode (*Hardcode*).  
   * Gunakan file .env untuk *development*.  
   * Pastikan .env terdaftar di .gitignore (tidak boleh ikut ter-push ke GitHub).  
3. **Sinkronisasi Database:** Saat akan *deploy* fitur baru yang mengubah struktur ERD (misal ada tambahan tabel/kolom), pastikan menjalankan perintah migrasi Prisma (npx prisma migrate deploy) pada *database production* sesaat setelah kode di-*deploy*.  
* 

