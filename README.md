# Emerald Gold Wedding v1.0 — Platform Undangan Pernikahan Elegan & Modern

Template undangan pernikahan multi-tenant siap pakai dengan arsitektur serverless di atas **Cloudflare Pages**, **Cloudflare Pages Functions (API)**, dan **Cloudflare D1 SQL Database**. Dioptimalkan khusus untuk tampilan smartphone Android dengan tema visual **Emerald Green (#073f35)** dan **Champagne Gold (#d4af37)** bergaya Islami premium.

---

## 1. Fitur Utama

### A. Sisi Undangan Tamu (Mobile-First)
- **Cover Pembuka Fullscreen:** Ornamen islami, kaligrafi basmalah, foto mempelai, animasi denyut tombol, dan teks personalisasi penerima.
- **Auto-Play Audio Berizin:** Musik latar otomatis berputar mulus saat tombol "Buka Undangan" diklik (lolos aturan pembatasan autoplay Android Chrome & Samsung Internet).
- **Floating Music Control:** Tombol putar/jeda melayang dengan animasi piringan hitam berputar.
- **Kutipan Suci Islami & Our Story:** Ayat Al-Qur'an (QS. Ar-Rum: 21) dan narasi perjalanan cinta kedua mempelai.
- **Profil Lengkap Kedua Mempelai:** Nama panggilan, gelar, serta nama orang tua masing-masing.
- **Detail Acara Terpisah:** Jadwal akad nikah dan resepsi lengkap dengan hitung mundur (countdown realtime).
- **Integrasi Google Maps:** Tombol navigasi langsung menuju lokasi hajatan via Google Maps.
- **Galeri Foto & Video Pernikahan:** Galeri grid responsif dan pemutar video YouTube terintegrasi otomatis.
- **Amplop Digital & Kado:** Nomor rekening bank, nama pemilik, tombol salin instan satu-klik, serta alamat kirim kado fisik.
- **Formulir RSVP Terpadu:** Pilihan kehadiran (Hadir, Ragu, Belum Dapat Hadir), jumlah orang, dan doa restu.
- **Buku Tamu Publik Realtime:** Doa dan ucapan selamat dari para tamu langsung tampil di bawah formulir RSVP.
- **Tombol Berbagi WhatsApp:** Generator pesan undangan otomatis yang langsung membuka WhatsApp.

### B. Sisi Dashboard Admin
- **Autentikasi Kriptografis HMAC SHA-256:** Sesi aman via cookie HttpOnly, Secure, dan SameSite. Password disimpan di serverless environment secrets (bukan di frontend).
- **Manajemen Multi-Undangan (CRUD):** Satu platform dapat menampung tak terbatas pasangan pengantin dengan slug unik masing-masing (misal: `/i/demo`, `/i/ahmad-siti`).
- **Kelola Tamu & Link Undangan Personal:** Tambah nama tamu, generate token unik, dan salin link personal instan (`/i/slug?to=Bapak+Ahmad&token=xxx`) atau kirim via WhatsApp.
- **Rekapitulasi RSVP & Ekspor CSV:** Pantau status kehadiran dan unduh seluruh data RSVP ke file Excel/CSV.

---

## 2. Struktur Proyek

```text
emerald-gold-wedding-v1/
├── functions/
│   └── api/
│       ├── _utils.js                          # Helper JSON, sanitasi, sesi HMAC SHA-256
│       ├── invitation/
│       │   └── [slug].js                      # API publik data undangan & daftar ucapan
│       ├── rsvp.js                            # API submit RSVP publik
│       └── admin/
│           ├── login.js                       # Autentikasi admin
│           ├── logout.js                      # Hapus sesi cookie
│           ├── me.js                          # Cek status sesi login
│           ├── invitations.js                 # List & Create undangan
│           ├── invitations/
│           │   ├── [id].js                    # Update & Delete undangan
│           │   └── [id]/
│           │       ├── guests.js              # List & Tambah tamu personal
│           │       └── rsvps.js               # List RSVP & Ekspor CSV
│           └── guests/
│               └── [id].js                    # Hapus tamu personal
├── public/
│   ├── _redirects                             # Routing Cloudflare Pages (/i/* -> index.html)
│   ├── index.html                             # Template undangan publik
│   ├── style.css                              # Desain Emerald Green & Champagne Gold responsif
│   ├── app.js                                 # Logika frontend undangan publik
│   ├── admin.html                             # Dashboard admin responsif mobile
│   └── admin.js                               # Logika manajemen dashboard
├── schema.sql                                 # Skema tabel SQLite Cloudflare D1
├── seed.sql                                   # Data contoh demo
├── wrangler.toml                              # Konfigurasi Cloudflare D1 binding
└── README.md                                  # Dokumentasi dan panduan deployment
```

---

## 3. Langkah Instalasi & Deployment via HP Android (100% Gratis)

Semua proses deployment dapat diselesaikan langsung melalui browser Android (Chrome / Firefox / Samsung Internet) tanpa memerlukan terminal laptop:

### Langkah 1: Siapkan Repositori di GitHub
1. Buka browser di HP dan login ke [GitHub](https://github.com).
2. Buat repositori baru bernama `emerald-gold-wedding`. Atur visibilitas ke **Private** atau **Public**.
3. Unggah seluruh isi file proyek ini ke repositori tersebut (pastikan struktur folder `public/`, `functions/`, dsb. tidak berubah).

### Langkah 2: Buat Database D1 di Cloudflare
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Di menu samping, pilih **Storage & Databases** > **D1 SQL Database**.
3. Klik **Create database**, beri nama: `emerald-wedding-db`, lalu klik **Create**.
4. Buka tab **Console** pada database yang baru dibuat:
   - Salin seluruh isi file `schema.sql`, tempel ke konsol query, lalu klik **Execute**.
   - Salin seluruh isi file `seed.sql`, tempel ke konsol query, lalu klik **Execute** untuk mengisi data awal demo.
5. Catat **Database ID** yang tertera di halaman ikhtisar database D1.

### Langkah 3: Deploy ke Cloudflare Pages
1. Di sidebar Cloudflare, pilih **Workers & Pages** > **Create application** > tab **Pages** > **Connect to Git**.
2. Pilih repositori GitHub `emerald-gold-wedding` yang telah Anda buat.
3. Pada halaman konfigurasi Build:
   - **Framework preset:** `None`
   - **Build command:** *(Biarkan kosong)*
   - **Build output directory:** `public`
4. Klik **Save and Deploy**. Tunggu hingga proses build selesai.

### Langkah 4: Hubungkan Binding Database D1 & Environment Secrets
1. Setelah deployment pertama selesai, masuk ke menu proyek Pages Anda di Cloudflare:
   - Buka **Settings** > **Functions** > gulir ke **D1 database bindings**.
   - Klik **Add binding**:
     - **Variable name:** `DB` *(Wajib huruf kapital)*
     - **D1 database:** Pilih `emerald-wedding-db`
   - Klik **Save**.
2. Masuk ke **Settings** > **Variables and Secrets**:
   - Tambahkan Environment Variable:
     - `ADMIN_PASSWORD`: Buat password admin yang kuat (misal: `Miftah#Wedding2026!`).
     - `SESSION_SECRET`: Masukkan string acak panjang minimal 32 karakter untuk enkripsi token HMAC (misal: `k8h29fnw09823bdfui34r9h8sdfn23984y`).
   - Klik **Save**.
3. Buka tab **Deployments**, klik titik tiga pada deployment aktif, lalu pilih **Retry deployment** (atau lakukan commit baru) agar variabel dan binding D1 terbaca oleh Functions.

---

## 4. Penggunaan

- **Melihat Undangan Demo:** Buka `https://nama-proyek.pages.dev/i/demo`
- **Link Personal Tamu:** Buka `https://nama-proyek.pages.dev/i/demo?to=Bapak%20Ahmad`
- **Dashboard Admin:** Buka `https://nama-proyek.pages.dev/admin` dan masukkan password admin Anda.
