# **PROJECT MANAGEMENT PLAN (PMP)**

## **2.1 Project Management Plan (PMP)**

Bagian ini mendefinisikan bagaimana proyek akan dieksekusi, dimonitor, dan dikendalikan hingga tahap rilis dengan mempertimbangkan kapasitas *Solo Developer* (dikerjakan mandiri).

### **A. Schedule Management (Manajemen Jadwal)**

* **Pendekatan Proyek (Project Approach):**  
* Proyek ini akan menggunakan metodologi **Agile (Scrum framework disesuaikan untuk Solo Developer)**. Pendekatan ini dipilih karena ini adalah proyek *Minimum Viable Product* (MVP) yang membutuhkan iterasi cepat dan *feedback* langsung dari HR (sebagai *Product Owner*) di setiap akhir sprint pengembangan.  
* **Tools untuk Tracking & Kolaborasi:**  
  * **Manajemen Tugas & Dokumentasi:** **Notion** (Menggunakan *Kanban Board* untuk memantau status *To-Do, In Progress, Review, Done*, sekaligus sentralisasi PRD, Backlog, dan catatan rapat).  
  * **Version Control & Code Repository:** **GitHub** (Manajemen *source code* dan *versioning* mandiri).  
  * **Komunikasi Proyek:** Grup **WhatsApp (WA)** khusus proyek untuk pelaporan *progress* harian/mingguan dan koordinasi cepat dengan *stakeholder* (HR/Manajemen).  
* **Target Rilis (Timeline Level Tinggi):**  
* Estimasi durasi proyek hingga rilis MVP adalah **6 Minggu**.  
  * **Minggu 1:** Inisiasi & Perencanaan (Requirement, ERD, UI/UX Wireframe).  
  * **Minggu 2 \- 4:** Tahap *Development* (Sprint 1: Modul Presensi & Auth | Sprint 2: Modul Lembur & Report).  
  * **Minggu 5:** *Testing* (SIT mandiri & UAT bersama HR).  
  * **Minggu 6:** *Deployment* ke Production, Pelatihan (Training), dan Rilis Resmi (Mid-November 2026).

### **B. Cost Management (Estimasi Anggaran)**

Mengingat proyek ini dikerjakan secara *in-house* dan berstatus MVP, strategi anggaran difokuskan pada **Zero Cost (Rp 0\)** untuk fase awal dengan memanfaatkan layanan berbasis *Free Tier*.

* **Opsi Infrastruktur & Cloud Gratis (Zero Cost):**  
  * **Hosting Aplikasi (Web/API):** Menggunakan platform *Platform as a Service* (PaaS) seperti **Render**, **Railway**, atau **Vercel**. Layanannya gratis dengan batasan *traffic* wajar yang sangat mencukupi untuk pemakaian internal (MVP).  
  * **Database Hosting:** Menggunakan *Database as a Service* seperti **Supabase** (PostgreSQL) atau **MongoDB Atlas** (NoSQL) yang menyediakan kapasitas *Free Tier* gratis dan andal.  
  * **Domain:** Menggunakan *subdomain* bawaan dari platform gratis, atau menumpang *subdomain* gratis dari domain *existing* perusahaan (misal: hris.aksatech.com).  
* **Opsi Berbayar (Plan B \- Skalabilitas Masa Depan):**  
  * Jika pemakaian sudah melebihi kuota gratis atau butuh kontrol penuh, akan disiapkan Virtual Private Server (VPS) lokal (misal: Niagahoster/Biznet Gio) dengan estimasi \~Rp 150.000 \- Rp 300.000 / bulan.  
* **Tools & Lisensi:**  
  * Notion & GitHub: Menggunakan versi *Free Tier*.  
* **Sumber Daya Manusia (SDM):**  
  * Dialokasikan penuh dari waktu kerja mahasiswa magang secara mandiri (*Solo Developer* \- tidak ada biaya *outsource* tambahan).

### **C. Quality Management (Manajemen Kualitas)**

Untuk memastikan sistem berfungsi sesuai dengan kesepakatan *business rules*, berikut adalah standar kualitas yang diterapkan:

#### **1\. Standar Fitur (Acceptance Criteria)**

Setiap fitur utama (User Story) harus memiliki *Acceptance Criteria* menggunakan format **BDD (Behavior-Driven Development): Given / When / Then**.

*(Catatan: Detail lengkap BDD untuk seluruh fitur akan dijabarkan secara spesifik pada dokumen terpisah: Arsitektur Kebutuhan & Product Backlog).*

**Contoh Format Penerapan:**

* **Kondisi:** Sistem memblokir *scan* di luar jaringan.  
  * **Given:** Karyawan **tidak** terhubung ke jaringan Wi-Fi PT Aksa Tech,  
  * **When:** Karyawan melakukan *scan* QR presensi,  
  * **Then:** Sistem menolak proses presensi dan memunculkan pesan *error* "Jaringan tidak dikenali".

#### **2\. Standar Rilis (Definition of Done \- DoD)**

Sebuah *task* atau fitur secara keseluruhan dinyatakan "Selesai" (Done) dan siap dirilis jika memenuhi semua syarat berikut:

1. **Code Complete:** *Coding* selesai, kode rapi, dan tidak ada *error* kritis saat dijalankan di komputer lokal (Local Environment).  
2. **Self-Review & Testing:** Kode telah melewati pengujian mandiri yang ketat (semua skenario *Given/When/Then* terpenuhi) dan alur *UI/UX* berfungsi mulus.  
3. **UAT Passed:** *User Acceptance Testing* telah dilakukan. Pihak HR telah mencoba fitur tersebut dan menyatakan setuju (sesuai ekspektasi).  
4. **Deployed:** Fitur telah berhasil dinaikkan ke server produksi (layanan *hosting* gratis) dan dapat diakses dengan normal dari jaringan Wi-Fi perusahaan.

