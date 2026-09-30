# **DOKUMEN PANDUAN DESAIN UI/UX (UI/UX DESIGN GUIDELINES)**

**Perusahaan:** PT Aksa Tech

**Tema:** Modern, Minimalis, Clean (Hanya Light Mode)

## **1\. Sistem Desain (Design System)**

Sistem warna dan tipografi dirancang agar bersih, profesional, dan mengurangi *cognitive load* pengguna.

* **Warna Utama (Primary):** \#1F77C5 (Aksen Biru Korporat). Digunakan untuk tombol *Call to Action* utama, *active state* pada navigasi, dan ikon esensial.  
* **Warna Latar (Background):**  
  * \#FFFFFF (Putih Murni): Untuk *container* utama, *cards*, dan formulir.  
  * \#F8FAFC (Slate-50): Untuk warna latar belakang global (kanvas aplikasi) agar elemen *card* warna putih terlihat menonjol dan memiliki dimensi.  
* **Warna Teks:**  
  * \#0F172A (Slate-900): Untuk teks judul (*heading*), nama karyawan, dan angka metrik.  
  * \#475569 (Slate-600): Untuk teks paragraf, sub-teks, dan *placeholder*.  
* **Warna Status (Semantic Colors):**  
  * \#10B981 (Hijau): Status Sukses / Hadir / Approved.  
  * \#EF4444 (Merah): Status Error / Alpha / Rejected / Tindakan Destruktif.  
  * \#F59E0B (Kuning/Amber): Status Pending / Pengajuan Lembur.  
* **UI Component Library:** **shadcn/ui**. Digunakan untuk *copy-paste* komponen berbasis Tailwind CSS murni.  
* **Ikonografi:** **Lucide React**. Digunakan secara eksklusif untuk menjaga konsistensi ketebalan dan gaya ikon.  
* **Tipografi:** Inter atau Geist (Bawaan Next.js) dengan format sans-serif.

## **2\. Wireframe & Alur Pengguna (User Flow)**

### **A. Tampilan Karyawan / Staff (Mobile-First Optimization)**

Karena staf sebagian besar akan mengakses sistem via *smartphone* saat berada di lokasi, UI dirancang responsif dengan navigasi bawah (*bottom bar*) agar mudah dijangkau ibu jari.

* **Halaman Login:**  
  * Logo PT Aksa Tech di tengah atas.  
  * *Input* Username/Email dan Password.  
  * Tombol "Masuk" *full-width* dengan warna biru \#1F77C5.  
* **Halaman Utama (Home):**  
  * **Header:** Sapaan "Halo, \[Nama\]" dan jam digital *real-time* berukuran besar.  
  * **Call to Action (CTA) Utama:** Tombol melingkar berukuran masif di tengah layar dengan ikon QR Scanner dan teks "Scan Absen". Didesain agar mustahil terlewatkan.  
  * **Status Card:** Dua kotak kecil berdampingan di bawah tombol *scan*, menampilkan jam "Clock In" dan "Clock Out" hari ini secara *real-time*.  
  * **Bottom Navigation (Fixed):** Ikon navigasi untuk Home (Beranda), Riwayat (History), Lembur (Overtime), dan Profil.  
* **Halaman Pemindai (Scanner QR):**  
  * Layar penuh membuka kamera.  
  * Terdapat kotak pembatas *scan* (reticle) di tengah dengan animasi pemindaian.  
  * Tombol "Batal" / "Kembali" di bagian bawah layar.

### **B. Tampilan Admin / HR & PM (Desktop-First Optimization)**

Diakses melalui komputer kantor, menggunakan *layout* standar *dashboard* operasional dengan *Sidebar* tetap (fixed) di sebelah kiri.

* **Halaman Utama (Dashboard):**  
  * **Top Bar:** Menampilkan Profil Admin, Jam, dan *Breadcrumb* navigasi.  
  * **Widget Statistik (Row 1):** Tiga *Card* utama berjejer horizontal di bagian paling atas:  
    1. **Total Kehadiran Hari Ini:** Menampilkan angka metrik besar dan persentase dari total karyawan.  
    2. **Kendala Presensi:** Menampilkan jumlah karyawan yang lupa *clock-out* kemarin atau berstatus *alpha*.  
    3. **Menunggu Persetujuan (Pending Overtime):** Angka peringatan/notifikasi untuk pengajuan lembur yang butuh tindakan PM/Admin.  
  * **Tabel Aktivitas (Row 2):** Tabel lebar yang berisi *Log* aktivitas presensi terbaru secara *real-time*.  
* **Halaman Manajemen Data (CRUD Table):**  
  * Menggunakan *Data Table* dari shadcn/ui.  
  * Wajib memiliki kolom pencarian (*Search*) berdasarkan nama karyawan.  
  * Wajib memiliki filter (*Dropdown*) berdasarkan rentang tanggal atau status.  
  * Tombol aksi (seperti "Tambah Karyawan" atau "Manual Override") selalu diletakkan di pojok kanan atas, sejajar dengan judul halaman.

## **3\. Aturan Interaksi & Pengalaman Pengguna (UX Rules)**

* **Feedback Instan (Toasts):** Setiap aksi pengguna (simpan data, hapus akun, absensi berhasil/gagal, *error* jaringan) wajib memunculkan *Toast Notification* di pojok layar yang akan hilang otomatis setelah 3 detik.  
* **Konfirmasi Destruktif (Modals):** Tindakan yang mengubah status secara permanen atau destruktif (seperti "Nonaktifkan Akun", "Tolak Lembur", "Ubah Status Presensi") wajib memunculkan *Modal Dialog* konfirmasi untuk mencegah klik tidak sengaja.  
* **Loading State (Skeletons):** Gunakan *Skeleton Loading* saat mengambil data dari *database*. Dilarang keras membiarkan layar kosong (*blank*) atau membeku (*freeze*) saat terjadi interaksi data (*fetching*).  
* **Optimasi Formulir:** Hindari penggunaan *input* teks manual (*free text*) sebisa mungkin untuk mengurangi *typo*. Gunakan elemen *Dropdown* (Select) untuk pilihan pasti. Contoh: Saat Admin menggunakan fitur *Manual Override*, status harus dipilih dari *Dropdown* (Hadir, Sakit, Izin), bukan diketik.

