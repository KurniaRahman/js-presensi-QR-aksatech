# **PROJECT CHARTER**

**Sistem Informasi Presensi & Manajemen Lembur**

## **1\. Informasi Proyek**

* **Nama Proyek:** Digitalisasi Presensi & Lembur (*Human Resource Information System*)  
* **Perusahaan:** PT Aksa Tech  
* **Project Manager:** Arif Kurnia Rahman  
* **Tanggal Dokumen:** 30 September 2026  
* **Status Dokumen:** *Draft / For Review*

## **2\. Latar Belakang & Problem Statement**

**Latar Belakang:**

PT Aksa Tech saat ini mengandalkan proses manual berbasis kertas untuk pencatatan kehadiran karyawan dan *spreadsheet* manual untuk manajemen pengajuan lembur. Seiring berjalannya operasional, metode ini menimbulkan berbagai inefisiensi yang menghambat kinerja departemen HR.

**Problem Statement:**

1. **Integritas Data Rendah Akibat Human Error:** Sistem manual (tanda tangan kertas) membuat karyawan sering kali lupa melakukan presensi tepat waktu. Akibatnya, pencatatan sering dilakukan susulan berdasarkan perkiraan ingatan staf semata, sehingga data kehadiran tidak akurat dan tidak mencerminkan kondisi *real-time*.  
2. **Inefisiensi Waktu Rekapitulasi:** Departemen HR / Admin menghabiskan waktu hingga 5 hari kerja di akhir bulan untuk memvalidasi ingatan/catatan karyawan, merekapitulasi data presensi, dan menyinkronkan data lembur.  
3. **Manajemen Lembur Tidak Terstruktur:** Ketiadaan alur *approval* digital yang terintegrasi menyebabkan perbedaan catatan antara karyawan dan HR terkait jam lembur sehingga perlu cek ulang secara manual.

## **3\. Product Vision & Product Goal**

**Product Vision:**

Menciptakan ekosistem kerja yang disiplin dan transparan melalui sistem presensi digital yang aman, cepat, dan mudah digunakan oleh seluruh karyawan PT Aksa Tech.

**Product Goal:**

Membangun Minimum Viable Product (MVP) Sistem Informasi Presensi berbasis web yang mengintegrasikan pencatatan kehadiran via pemindaian *QR Code* (dengan proteksi jaringan lokal/Wi-Fi) dan mengotomatisasi alur persetujuan lembur, guna memangkas waktu administratif HR hingga 80%.

## **4\. Objectives & Key Results (OKR)**

**Objective 1: Meningkatkan Efisiensi Operasional HR (Rekapitulasi)**

* **KR 1.1:** Mengurangi waktu rekapitulasi laporan presensi bulanan dari 5 hari kerja menjadi maksimal 1 hari kerja (atau *real-time*).  
* **KR 1.2:** Menghasilkan 100% laporan (kehadiran & lembur) secara otomatis yang siap diekspor ke format Excel.

**Objective 2: Meningkatkan Akurasi Data & Meminimalisir Human Error**

* **KR 2.1:** Mengeliminasi 100% pencatatan absensi yang tidak akurat (akibat lupa dan mengandalkan ingatan) melalui *QR Code* yang wajib diakses secara *real-time* dari jaringan kantor.  
* **KR 2.2:** Meminimalisir *error* teknis atau absen ganda (*double-scan*) hingga 0% dengan fitur *Cooldown Timer*.

**Objective 3: Mendigitalisasi Manajemen Lembur (Overtime)**

* **KR 3.1:** 100% pengajuan dan persetujuan lembur dilakukan melalui sistem (tanpa kertas).  
* **KR 3.2:** Memastikan batas maksimal lembur harian (3 jam) tervalidasi secara otomatis oleh sistem.

## **5\. Ruang Lingkup Proyek (Scope Boundary)**

### **IN-SCOPE (Batasan yang Dikerjakan / MVP)**

1. **Modul Autentikasi & Otorisasi:** Login dan manajemen 3 Role utama (Admin/HR, Project Manager, Staff).  
2. **Modul Presensi (Scan QR Code):**  
   * *Check-in* dan *Check-out* dengan logika Total Durasi.  
   * Mekanisme keamanan *Cooldown Timer* (mencegah *double-scan* berdekatan).  
   * Validasi Jaringan (*Wi-Fi Restriction/IP Whitelisting*): Sistem menolak presensi jika perangkat tidak terhubung ke jaringan kantor.  
3. **Modul Overtime (Lembur):**  
   * Pengajuan lembur oleh Staff.  
   * *Approval workflow* oleh Project Manager (PM).  
   * Logika pembatasan maksimal 3 jam per hari dengan pembagian tier waktu (1 jam pertama, 2 jam berikutnya).  
   * Input nominal *rate* lembur secara manual/dinamis oleh Admin di akhir bulan.  
4. **Modul Administratif (HR Admin):**  
   * Fitur *Manual Override* untuk mengubah status karyawan (Sakit, Izin, Hadir Manual) tanpa sistem menganggap 'Alpha'.  
   * Generate dan *Export Report* (Presensi & Lembur) ke format .xlsx atau .csv.

### **OUT-OF-SCOPE (Batasan yang Tidak Dikerjakan di Fase Ini)**

1. Fitur pemindaian lokasi berbasis GPS (*Geofencing*) untuk karyawan di luar kantor.  
2. Presensi dengan menggunakan biometrik wajah (*Face Recognition*) atau *Fingerprint*.  
3. Logika pengajuan atau pencatatan "Lembur Remote" (di luar jaringan kantor).  
4. Modul *Payroll* terintegrasi (penghitungan pajak PPh 21, BPJS, atau slip gaji penuh).  
5. Otomatisasi perhitungan nominal nilai uang lembur (*hardcode rate*).

## **6\. Key Stakeholders**

1. **Project Sponsor / Management:** Direktur / Pimpinan PT Aksa Tech (Pemberi dana/persetujuan akhir).  
2. **Operational Manager / HR Manager:** Pemilik proses bisnis (Business Owner) yang mendefinisikan aturan dan pengguna utama modul *Report & Override*.  
3. **Project Manager & System Analyst:** Arif Kurnia Rahman (Bertanggung jawab merancang spesifikasi dan mengawal proyek hingga rilis).  
4. **Project Manager (Divisi):** Sebagai *Approver* (Penyetuju) untuk pengajuan lembur anggota timnya.  
5. **Staff / Karyawan (End-User):** Pengguna akhir yang akan melakukan *Scan QR* harian dan mengajukan lembur.  
6. **Development Team (Programmer):** Tim teknis yang akan mengimplementasikan sistem berdasarkan dokumen ini.