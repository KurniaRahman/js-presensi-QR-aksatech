# **DATABASE SCHEMA & ERD (Entity Relationship Diagram)**

**Proyek:** Sistem Informasi Presensi & Manajemen Lembur (MVP)

**Standardisasi Naming:** snake\_case untuk kolom database.

**Tipe Database Referensi:** Relasional (PostgreSQL / MySQL).

## **1\. Visualisasi ERD (Mermaid)**

erDiagram  
    USERS ||--o{ ATTENDANCES : "melakukan"  
    USERS ||--o{ OVERTIMES : "mengajukan"  
    USERS ||--o{ OVERTIMES : "menyetujui (PM)"  
    USERS ||--o{ ATTENDANCES : "override (Admin)"

    USERS {  
        uuid id PK  
        string email UK  
        string password\_hash  
        string full\_name  
        enum role "STAFF, PM, ADMIN"  
        boolean is\_active  
        timestamp created\_at  
    }

    ATTENDANCES {  
        uuid id PK  
        uuid user\_id FK  
        date record\_date  
        timestamp clock\_in  
        timestamp clock\_out  
        int duration\_minutes  
        enum status "HADIR, SAKIT, IZIN, ALPHA"  
        uuid override\_by FK "nullable"  
    }

    OVERTIMES {  
        uuid id PK  
        uuid user\_id FK  
        date request\_date  
        int duration\_hours  
        string reason  
        enum status "PENDING, APPROVED, REJECTED"  
        uuid approved\_by FK "nullable"  
        timestamp created\_at  
    }

    SYSTEM\_SETTINGS {  
        string key PK  
        string value  
    }

## **2\. Detail Spesifikasi Tabel**

### **Tabel 1: users**

Menyimpan data kredensial dan hak akses. Tidak perlu tabel terpisah untuk Role di fase MVP, cukup gunakan tipe *Enum*.

| Kolom | Tipe Data | Constraint | Keterangan / Aturan Bisnis |
| :---- | :---- | :---- | :---- |
| id | UUID / BigInt | PRIMARY KEY | Identifier unik. |
| email | Varchar | UNIQUE, NOT NULL | Digunakan untuk Login. |
| password\_hash | Varchar | NOT NULL | Hasil enkripsi *password* (Bcrypt). |
| full\_name | Varchar | NOT NULL | Nama lengkap karyawan. |
| role | Enum | NOT NULL | Value: 'STAFF', 'PM', 'ADMIN'. Menentukan hak akses UI dan API. |
| is\_active | Boolean | DEFAULT TRUE | Status aktif akun (Soft Delete). Jika false, user tidak bisa login. |
| created\_at | Timestamp | DEFAULT NOW() | Waktu akun dibuat. |

### **Tabel 2: attendances**

Mencatat data *Clock-in*, *Clock-out*, dan kalkulasi total durasi kerja harian.

| Kolom | Tipe Data | Constraint | Keterangan / Aturan Bisnis |
| :---- | :---- | :---- | :---- |
| id | UUID / BigInt | PRIMARY KEY | \- |
| user\_id | UUID / BigInt | FOREIGN KEY | Relasi ke users.id. |
| record\_date | Date | NOT NULL | Tanggal presensi (YYYY-MM-DD). Mencegah *query* berat saat filter bulan. |
| clock\_in | Timestamp | NOT NULL | Waktu absen pertama. |
| clock\_out | Timestamp | NULLABLE | Waktu absen kedua. Kosong jika belum pulang. |
| duration\_minutes | Integer | NULLABLE | Total durasi kerja dalam menit (dihitung saat *clock\_out*). |
| status | Enum | DEFAULT 'HADIR' | Value: 'HADIR', 'SAKIT', 'IZIN', 'ALPHA'. |
| override\_by | UUID / BigInt | FK, NULLABLE | Relasi ke users.id (Admin). Terisi jika status diubah manual (Manual Override). |

*(Catatan Logika Aplikasi: Fitur "Cooldown 15 Menit" divalidasi di level Backend dengan mengecek selisih waktu clock\_in terakhir, bukan di level struktur Database).*

### **Tabel 3: overtimes**

Mencatat pengajuan lembur dan status *approval* oleh PM.

| Kolom | Tipe Data | Constraint | Keterangan / Aturan Bisnis |
| :---- | :---- | :---- | :---- |
| id | UUID / BigInt | PRIMARY KEY | \- |
| user\_id | UUID / BigInt | FOREIGN KEY | Relasi ke users.id (Staff yang mengajukan). |
| request\_date | Date | NOT NULL | Tanggal pelaksanaan lembur. |
| duration\_hours | Integer | NOT NULL | Maksimal angka adalah 3 (Divalidasi di Backend). |
| reason | Text | NOT NULL | Alasan lembur untuk direview PM. |
| status | Enum | DEFAULT 'PENDING' | Value: 'PENDING', 'APPROVED', 'REJECTED'. |
| approved\_by | UUID / BigInt | FK, NULLABLE | Relasi ke users.id (PM yang melakukan *approve/reject*). |
| created\_at | Timestamp | DEFAULT NOW() | Waktu form disubmit. |

### **Tabel 4: system\_settings (Tabel Utilitas)**

Tabel *Key-Value* sederhana untuk menghindari *Hardcode* pada sistem, sesuai *User Story* 4.2 (Input Nominal Lembur Dinamis).

| Kolom | Tipe Data | Constraint | Keterangan / Aturan Bisnis |
| :---- | :---- | :---- | :---- |
| key | Varchar | PRIMARY KEY | Contoh isian: 'overtime\_rate\_per\_hour'. |
| value | Varchar | NOT NULL | Contoh isian: '50000' (Di-*parse* menjadi Integer saat digunakan). |

