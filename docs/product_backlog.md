# **PRODUCT BACKLOG & AGILE WBS (Work Breakdown Structure)**

## **Panduan Dokumen**

Dokumen ini memecah kebutuhan sistem menjadi unit yang lebih kecil untuk dieksekusi oleh *Solo Developer*.

* **Epic:** Fitur besar / Modul utama.  
* **User Story:** Fungsionalitas spesifik dari sudut pandang pengguna (Format: *As a \[Role\], I want to \[Action\], so that \[Benefit\]*).  
* **MoSCoW:** Prioritas pengerjaan (Must Have, Should Have, Could Have, Won't Have).  
* **Acceptance Criteria (BDD):** Skenario pengetesan menggunakan format *Given* (Kondisi Awal), *When* (Aksi), *Then* (Hasil yang Diharapkan).

## **EPIC 1: Manajemen Akses & Autentikasi** ✅ DONE

### **1.1 User Story: Login Sistem** [x]

*As a User (Staff/PM/Admin), I want to login using my credentials, so that I can access the system securely.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Login Berhasil**  
    * *Given* pengguna memasukkan email dan *password* yang valid,  
    * *When* pengguna menekan tombol "Login",  
    * *Then* sistem mengarahkan ke Dashboard sesuai *Role* masing-masing (Staff/PM/Admin).  
  * **Scenario: Kredensial Salah**  
    * *Given* pengguna memasukkan *password* yang salah,  
    * *When* menekan tombol "Login",  
    * *Then* sistem menampilkan pesan error "Kredensial tidak valid" dan tetap di halaman login.

### **1.2 User Story: Role-Based Access Control (RBAC)** [x]

*As an Admin, I want the system to restrict access based on roles, so that Staff cannot access HR settings.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Restriksi Menu HR**  
    * *Given* pengguna login dengan *Role* "Staff",  
    * *When* mencoba mengakses URL /admin/reports,  
    * *Then* sistem menolak akses dan menampilkan halaman "403 Forbidden".

## **EPIC 2: Modul Presensi & Keamanan Jaringan** 📝 TODO

### **2.1 User Story: Validasi Jaringan Lokal (Wi-Fi Restriction)** [ ]

*As an Admin, I want the attendance feature to only work on the office network, so that staff cannot clock-in from home.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Akses dari luar kantor**  
    * *Given* perangkat pengguna memiliki IP Address yang **tidak** terdaftar dalam *Whitelist* IP Kantor,  
    * *When* pengguna membuka halaman "Scan QR",  
    * *Then* tombol kamera dinonaktifkan dan sistem menampilkan pesan "Anda harus terhubung ke Wi-Fi kantor untuk melakukan presensi."

### **2.2 User Story: Scan QR (Clock-In / Clock-Out) & Cooldown** [ ]

*As a Staff, I want to scan a QR code to record my attendance, so that my work hours are tracked automatically.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Clock-In (Absen Pertama)**  
    * *Given* pengguna belum melakukan absensi hari ini,  
    * *When* pengguna berhasil melakukan *Scan QR*,  
    * *Then* sistem mencatat waktu tersebut sebagai "Clock-In" dan menampilkan pesan "Selamat Bekerja".  
  * **Scenario: Pencegahan Double-Scan (Cooldown 15 Menit)**  
    * *Given* pengguna baru saja melakukan *Clock-In* 5 menit yang lalu,  
    * *When* pengguna melakukan *Scan QR* lagi,  
    * *Then* sistem menolak pencatatan dan menampilkan pesan "Anda baru saja melakukan absensi. Harap tunggu 10 menit lagi." (Cooldown aktif).  
  * **Scenario: Clock-Out (Absen Kedua)**  
    * *Given* pengguna sudah *Clock-In* lebih dari 15 menit yang lalu dan belum *Clock-Out*,  
    * *When* pengguna berhasil melakukan *Scan QR*,  
    * *Then* sistem mencatat waktu tersebut sebagai "Clock-Out", menghitung "Total Durasi Kerja", dan menampilkan pesan "Hati-hati di jalan".

## **EPIC 3: Modul Manajemen Lembur (Overtime)** 📝 TODO

### **3.1 User Story: Pengajuan Lembur** [ ]

*As a Staff, I want to submit an overtime request, so that my extra work is recorded for approval.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Pengajuan valid**  
    * *Given* pengguna mengisi form pengajuan lembur dengan durasi 2 jam dan alasan yang jelas,  
    * *When* form di-*submit*,  
    * *Then* status lembur menjadi "Pending Approval" dan notifikasi terkirim ke PM terkait.  
  * **Scenario: Melebihi batas maksimal**  
    * *Given* pengguna mengisi form pengajuan dengan durasi 4 jam,  
    * *When* form di-*submit*,  
    * *Then* sistem menolak pengajuan dan menampilkan pesan error "Maksimal lembur harian adalah 3 jam."

### **3.2 User Story: Approval Lembur oleh PM** [ ]

*As a Project Manager, I want to approve or reject overtime requests, so that only valid overtimes are processed by HR.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: PM Menyetujui Lembur**  
    * *Given* terdapat pengajuan lembur berstatus "Pending",  
    * *When* PM menekan tombol "Approve",  
    * *Then* status lembur berubah menjadi "Approved" dan data jam masuk ke rekapitulasi bulanan.

## **EPIC 4: Modul Administratif & Pelaporan** 📝 TODO

### **4.1 User Story: Manual Override (Penyesuaian Status)** [ ]

*As an Admin/HR, I want to manually update a staff's attendance status, so that I can handle sick leaves or technical errors without them being marked as Alpha.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Mengubah status menjadi Sakit**  
    * *Given* Admin memilih tanggal tertentu dan nama karyawan tertentu (yang belum absen),  
    * *When* Admin memilih status "Sakit" dan menekan "Simpan",  
    * *Then* sistem mencatat status kehadiran karyawan tersebut sebagai "Sakit" (bukan Alpha) di database.

### **4.2 User Story: Input Nominal Lembur (Dinamic Rate)** [ ]

*As an Admin, I want to input the overtime rate/nominal manually at the end of the month, so that the system doesn't need hardcoded salary calculations.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Input Rate**  
    * *Given* Admin membuka halaman Rekap Lembur,  
    * *When* Admin memasukkan angka nominal pada kolom "Rate Per Jam" dan menyimpan,  
    * *Then* sistem mengkalikan Total Jam Lembur *Approved* dengan Nominal tersebut pada tampilan rekap.

### **4.3 User Story: Export Laporan (Excel/CSV)** [ ]

*As an Admin, I want to export attendance and overtime data, so that I can process payroll easily in Excel.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Download Excel**  
    * *Given* Admin memfilter data untuk bulan "Oktober",  
    * *When* Admin menekan tombol "Export to Excel",  
    * *Then* sistem mengunduh file .xlsx yang berisi kolom: Nama, Tanggal, Jam Masuk, Jam Pulang, Durasi Kerja, Status (Hadir/Sakit/Izin/Alpha), dan Total Jam Lembur (Approved).

## **EPIC 5: Manajemen Pengguna (CRUD)** ✅ DONE

### **5.1 User Story: Tambah Pengguna Baru (Create)** [x]

*As an Admin, I want to create a new user account, so that new staff or PMs can access the system.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Berhasil menambahkan user**  
    * *Given* Admin berada di halaman Manajemen Pengguna,  
    * *When* Admin mengisi form (Nama, Email, Password, Role) dan menekan "Simpan",  
    * *Then* sistem menyimpan data ke *database*, meng-enkripsi *password*, dan menampilkan pesan "Pengguna berhasil ditambahkan".

### **5.2 User Story: Edit Data Pengguna (Update)** [x]

*As an Admin, I want to edit existing user details, so that I can update their role, name, or reset their password.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Update Role dan Nama**  
    * *Given* Admin memilih akun karyawan dan membuka form Edit,  
    * *When* Admin mengubah Role dari "Staff" menjadi "PM" lalu menekan "Simpan",  
    * *Then* data di sistem langsung diperbarui.  
  * **Scenario: Reset Password Karyawan**  
    * *Given* Admin berada di form Edit profil karyawan yang lupa *password*,  
    * *When* Admin mengisi kolom "Password Baru" dan menyimpan,  
    * *Then* sistem menimpa *password* lama dengan enkripsi *password* baru.

### **5.3 User Story: Nonaktifkan Pengguna / Soft Delete (Delete)** [x]

*As an Admin, I want to deactivate user accounts of resigned employees, so that they cannot login but their past data remains intact.*

* **Prioritas:** Must Have  
* **Acceptance Criteria (BDD):**  
  * **Scenario: Soft Delete Karyawan Resign**  
    * *Given* Admin memilih akun karyawan yang masih aktif,  
    * *When* Admin menekan tombol "Nonaktifkan Akun" (dan mengkonfirmasi),  
    * *Then* sistem mengubah status `is_active` menjadi `false`, mencegah user tersebut *login*, namun riwayat absennya tetap bisa ditarik di menu Laporan.

