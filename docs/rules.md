# **DOKUMEN PANDUAN TEKNIS & ATURAN SISTEM (SYSTEM RULES & TECH STACK)**

**Informasi Dokumen**

* **Proyek:** Sistem Informasi Presensi & Manajemen Lembur (MVP)  
* **Perusahaan:** PT Aksa Tech  
* **Role/Target Audien:** Solo Developer / Team / AI Code Assistant  
* **Versi Dokumen:** 1.3 (Updated with Mandatory --no-ff Production Release & Dedicated Docs Branching)  
* **Tanggal Pembaruan:** 27 Oktober 2026

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

## **5. Skema Git, VCS & Pipeline Dev-Staging-Production Profesional**

Untuk menjamin stabilitas sistem, kualitas kode, dan mencegah *breaking changes* di lingkungan produksi (*live*), seluruh pengembangan sistem wajib mematuhi skema alur rilis profesional berstandar industri berikut.

---

### **A. Arsitektur Percabangan Git (Branching Strategy)**

Proyek ini menerapkan model alur cabang terstruktur (*Environment-driven GitFlow*):

```
[Local Dev: feature/* | docs/*] ───> [Staging: develop] ───> [Production: main]
                   │                                                  │
                   └──────────────> [Hotfix: hotfix/*] ───────────────┘
```

1. **`main` (Production Branch - Strictly Protected):**
   * Merepresentasikan kode yang sedang berjalan di *server production* publik.
   * Bersifat **suci & stabil** (*always deployable*).
   * **DILARANG KERAS** melakukan commit langsung (*direct commit/push*) ke branch `main`.
   * Hanya menerima kode melalui *Pull Request (PR)* atau *Merge* teruji dari branch `develop` (wajib menggunakan `--no-ff`) atau `hotfix/*`.

2. **`develop` (Staging / Pre-Production Branch):**
   * Cabang integrasi seluruh fitur dan dokumentasi sebelum dirilis ke produksi.
   * Terhubung dengan lingkungan *Staging / Preview Deployment* (Vercel Preview).
   * Tempat dilakukannya pengujian integrasi lintas modul, uji coba performa, *QA review*, dan validasi fungsional bersama Project Manager (PM).

3. **`feature/<nama-fitur>` (Feature / Working Branches):**
   * Setiap tugas atau fitur baru wajib dikerjakan pada branch fitur terisolasi yang dicabangkan dari `develop`.
   * Penamaan standar: `feature/log-aktivitas`, `feature/drone-logbook`, `feature/flight-log`.
   * Setelah fitur tuntas dan lolos verifikasi lokal, branch digabungkan (*merged*) ke `develop`.

4. **`docs/<topik-dokumen>` (Documentation Branches - General):**
   * **ATURAN MUTLAK DOKUMEN:** Seluruh penambahan, restrukturisasi, atau pembaruan dokumentasi (baik `docs/rules.md`, `README.md`, panduan arsitektur, SOP teknis, maupun dokumentasi API) **WAJIB dibuatkan branch khusus tersendiri** berawalan `docs/`.
   * Dilarang keras mencampuradukkan perubahan dokumen ke dalam branch fitur fungsional (`feature/*`) atau perbaikan bug (`fix/*`).
   * Dicabangkan dari `develop`, dikerjakan terisolasi, diverifikasi, lalu di-*merge* kembali ke `develop`.
   * Penamaan standar: `docs/update-rules-workflow`, `docs/api-specification`, `docs/setup-guide`.

5. **`hotfix/<nama-bug>` (Emergency Production Fix):**
   * Khusus untuk perbaikan *critical bug* darurat di production yang tidak bisa menunggu siklus rilis reguler.
   * Dicabangkan langsung dari `main`, diperbaiki, diuji, lalu di-*merge* kembali ke `main` (dengan `--no-ff`) dan di-*backport* ke `develop`.

---

### **B. Matriks Pemisahan Lingkungan (Environment Separation)**

| Dimensi | 1. Local Development | 2. Staging Environment | 3. Production Environment |
| :--- | :--- | :--- | :--- |
| **Branch Target** | `feature/<nama-fitur>` | `develop` | `main` |
| **Domain / URL** | `http://localhost:3000` | Staging Preview URL (misal Vercel Preview) | Domain Utama Resmi (`https://...`) |
| **Database** | PostgreSQL Dev / Supabase Local Pool | PostgreSQL Staging Terisolasi | PostgreSQL Production Dedicated |
| **Kredensial ENV** | `.env` lokal | ENV Dashboard Staging | ENV Dashboard Production (Vault/Secret) |
| **Toleransi Error** | Bebas untuk eksperimen | Wajib 0 compiler error, data uji terkontrol | Toleransi Zero-Downtime, data riil pengguna |
| **Akses Pengguna** | Developer lokal | Tim Internal, PM, Tester QA | Seluruh Karyawan & Manajemen PT Aksa Tech |

---

### **C. Alur Standar Promosi Kode (Step-by-Step Promotion Workflow)**

#### **Tahap 1: Pengembangan Fitur (Feature Isolation)**
1. Tarik pembaruan terbaru dari staging:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Buat branch fitur baru:
   ```bash
   git checkout -b feature/<nama-fitur>
   ```
3. Lakukan pengembangan modular dengan *commit* berkala.

#### **Tahap 2: Quality Gates Pra-Integrasi (Wajib di Lokal)**
Sebelum menggabungkan kode ke staging, developer **WAJIB** menjalankan 3 validasi lokal berikut hingga exit code 0:
```bash
# 1. Pengecekan Type-Safety TypeScript
npx tsc --noEmit

# 2. Pengecekan Linting Kode
npm run lint

# 3. Pengecekan Kompilasi Build Produksi
npm run build
```
> **Aturan Mutlak:** Jika salah satu perintah di atas menghasilkan *error*, kode **DILARANG** dipush ke remote repository.

#### **Tahap 3: Integrasi ke Staging (`develop`)**
1. Commit seluruh perubahan lokal:
   ```bash
   git add .
   git commit -m "feat(scope): deskripsi fitur yang jelas"
   ```
2. Gabungkan ke `develop`:
   * **Opsi Best Practice (Pull Request):**
     Push branch fitur ke GitHub (`git push -u origin feature/<nama-fitur>`), lalu buat PR ke `develop` untuk direview.
   * **Opsi Direct Merge Lokal:**
     ```bash
     git checkout develop
     git pull origin develop
     git merge feature/<nama-fitur>
     git push origin develop
     ```
3. Sinkronkan database staging jika ada perubahan skema:
   ```bash
   npx prisma db push
   # atau jika menggunakan migration: npx prisma migrate deploy
   ```

#### **Tahap 4: Pengujian & Validasi di Lingkungan Staging**
* Lakukan *smoke test* seluruh alur utama: Login, Presensi Scan QR, Log Aktivitas, Logbook Drone, Approval Lembur.
* Pastikan hak akses role (*RBAC*) berjalan benar: `ADMIN`, `PM`, `STAFF` (Engineer), dan `MAGANG`.

#### **Tahap 5: Rilis ke Production (`main`)**
Setelah mendapat persetujuan (*sign-off*) dari Project Manager / Tech Lead dan seluruh *DoD* terpenuhi:
1. Pindah ke branch `main` dan tarik versi remote terbaru:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Gabungkan dari branch `develop` **WAJIB MENGGUNAKAN FLAG `--no-ff` (No Fast-Forward)**:
   ```bash
   git merge develop --no-ff -m "release(vX.Y.Z): <Rangkuman Rilis Fitur Utama>"
   ```
   > [!IMPORTANT]
   > **MENGAPA FLAG `--no-ff` MUTLAK DIGUNAKAN PADA RELEASE MAIN?**
   > Jika melakukan *merge* default tanpa `--no-ff`, Git akan melakukan *Fast-Forward* (hanya memajukan pointer `main` ke commit paling ujung di `develop`, seperti commit typo atau commit kecil lainnya). Hal ini berakibat pada dashboard CI/CD hosting (seperti Vercel Production Deployment) yang akan keliru menampilkan pesan rilis produksi tidak jelas dan tidak mencerminkan rilis fitur utama. Dengan `--no-ff`, Git dipaksa membuat *Merge Commit* rilis resmi yang jelas, profesional, dan informatif.
3. Berikan Tag Versi Rilis (*Semantic Versioning*):
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0: Aksa Tech Integrated Portal with Guest Role & Flight Logbook"
   ```
4. Push ke remote production beserta tag rilis:
   ```bash
   git push origin main --tags
   ```
5. Pantau proses *deployment* otomatis pada dashboard hosting (Vercel) hingga berstatus **Ready / Production**.

---

### **D. Standar Pesan Commit (Conventional Commits)**

Format pesan commit wajib mengikuti konvensi berikut:
```
<tipe>(<cakupan/scope>): <deskripsi singkat imperative>
```

* **`feat:`** Penambahan fitur baru bagi pengguna (contoh: `feat(drones): implement drone maintenance logbook`).
* **`fix:`** Perbaikan bug sistem (contoh: `fix(auth): resolve session timeout redirect loop`).
* **`docs:`** Pembaruan atau penambahan dokumentasi proyek (contoh: `docs(rules): enforce --no-ff on production releases`).
* **`refactor:`** Restrukturisasi kode tanpa mengubah alur logika bisnis (contoh: `refactor(activities): convert subtabs to unified timeline`).
* **`perf:`** Optimasi performa dan kecepatan render (contoh: `perf(dashboard): parallelize query attendance and overtime`).
* **`style:`** Perbaikan visual, spasi, CSS tanpa mengubah fungsionalitas logika.
* **`chore:`** Pembaruan dependensi, konfigurasi build, skrip database seed.

---

### **E. Protokol Keamanan & Sinkronisasi Database Antar Lingkungan**

1. **Isolasi Database:**
   * Dilarang keras menghubungkan aplikasi lokal atau staging ke connection string database Production!
   * Setiap environment harus memiliki URL database terpisah di Supabase/PostgreSQL.

2. **Aturan Sinkronisasi Skema (Schema Migration):**
   * Perubahan struktur tabel didefinisikan secara deklaratif di `prisma/schema.prisma`.
   * **Dilarang keras melakukan operasi destruktif** (seperti menghapus kolom yang masih dibaca oleh versi aplikasi lama). Gunakan strategi *two-phase deployment* (tambah kolom baru &rarr; deploy aplikasi &rarr; deprecate kolom lama).
   * Jalankan `npx prisma db push` (atau `prisma migrate deploy`) dengan didampingi backup/snapshot pada server produksi.

3. **Kebijakan Seeding Data:**
   * Skrip `prisma/seed.ts` hanya boleh berisi data awal yang esensial (seperti akun default, master unit drone awal, koordinat kantor).
   * Operasi penulisan seed **wajib menggunakan `upsert`** berdasarkan *unique identifier* (email atau serial number), dilarang menggunakan operasi `create` mentah agar dapat dijalankan berulang kali tanpa memicu error duplikasi.

4. **Keamanan Kredensial & Secrets:**
   * File `.env` dan `.env.local` tidak boleh di-*commit* ke Git (wajib ada di `.gitignore`).
   * Cantumkan seluruh daftar variabel yang dibutuhkan dalam file contoh `.env.example` tanpa menyertakan nilai rahasia riil.

---

### **F. Kriteria Kelulusan Rilis ke Production (Definition of Done - DoD)**

Sebuah fitur dinyatakan layak dipromosikan ke production apabila memenuhi seluruh ceklis berikut:
* [ ] **TypeScript Check**: `npx tsc --noEmit` lolos tanpa peringatan/error (0 errors).
* [ ] **Production Build**: `npm run build` sukses 100% dan seluruh route ter-generate rapi.
* [ ] **RBAC & Security**: Akses endpoint/Server Action telah terlindungi dari IDOR, SQL Injection (Prisma parameterized), dan role bypass.
* [ ] **Responsiveness**: Antarmuka diuji adaptif pada resolusi Mobile (360px - 414px) hingga Desktop (1280px+).
* [ ] **Audit Trail & Logging**: Aksi mutasi penting tercatat dengan cap waktu WIB dan identitas user yang valid.
