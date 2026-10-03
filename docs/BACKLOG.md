# Backlog Coffee Brewing

Ukuran tiket: **S** = ≤ ½ hari · **M** = 1–2 hari · **L** = 3+ hari

Status: `[ ]` belum · `[~]` dikerjakan · `[x]` selesai

---

## Sprint 0 — Riset & Desain (1 minggu)

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-01 | Wireframe 5 layar utama (pilih metode, kalkulator, timer, simpan resep, daftar resep) | M | [x] |
| TK-02 | Validasi tabel takaran default ke 2–3 barista / home brewer | M | [ ] |
| TK-03 | Tentukan nama final aplikasi, logo sederhana, dan warna → nama **Coffee Brewing**, warna tetap (oranye gelap #9A4A0A, tinta #1C1B1A, latar #F4F3F1). Logo menyusul | S | [x] |
| TK-04 | Wireframe layar Pengaturan (bahasa, satuan, tema) | S | [x] |
| TK-05 | Tulis teks UI dalam Bahasa Indonesia & Inggris → `docs/TEKS-UI.md` | S | [x] |
| TK-06 | Wireframe layar Panduan gilingan + bagian grind size di kalkulator | S | [x] |
| TK-07 | Validasi angka klik grinder ke pemilik grinder / barista | S | [ ] |

**Kriteria selesai Sprint 0:** wireframe disetujui, tabel takaran sudah dicek barista, daftar teks UI dua bahasa siap.

---

## Sprint 1 — Fondasi & Kalkulator

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-10 | Setup proyek: React + TypeScript + Vite + Tailwind, linting, struktur folder | S | [x] |
| TK-11 | Deploy otomatis ke Vercel dari branch `master` (project `coffee-brewing`, preview otomatis per PR) | S | [x] |
| TK-12 | Sistem i18n (file `id` & `en`), tombol ganti bahasa, simpan pilihan | M | [x] |
| TK-13 | Data metode seduh (9 metode: ratio, suhu, gilingan, waktu, langkah) | M | [x] |
| TK-14 | Layar **Pilih metode** (grid metode + kartu resep terakhir) | M | [x] |
| TK-15 | Layar **Kalkulator**: input kopi ↔ air dua arah, slider ratio, parameter | L | [x] |
| TK-16 | Logika khusus: espresso (dose → yield), Japanese iced (60% air panas / 40% es), cold brew (jam) | M | [x] |
| TK-17 | Unit test untuk semua rumus takaran | M | [x] |
| TK-18 | Panduan ukuran gilingan (6 level) + jumlah klik grinder manual (Comandante C40, Timemore C2/C3, Kingrinder K6, 1Zpresso Q2, 1Zpresso JX-Pro, Hario Skerton Pro) + opsi "grinder lain" dengan klik isi sendiri | M | [x] |

**Kriteria:** user bisa pilih metode dan langsung dapat takaran yang benar di HP, dalam 2 bahasa.

---

## Sprint 2 — Timer Seduh

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-20 | Generator jadwal tuang dari resep (bloom + tuangan, target berat kumulatif) | M | [x] |
| TK-21 | Layar **Timer**: waktu berjalan, langkah aktif, target gram, progress bar | L | [x] |
| TK-22 | Kontrol jeda / lanjut / langkah berikut / ulang | M | [x] |
| TK-23 | Bunyi + getar di tiap pergantian langkah (bisa dimatikan) | S | [x] |
| TK-24 | Layar tetap menyala saat timer jalan (Wake Lock API) | S | [x] |
| TK-25 | Timer tetap akurat walau app diminimize (hitung dari jam mulai, bukan interval) | M | [x] |
| TK-26 | Preset V60 metode 4:6 (Tetsu Kasuya) | S | [x] |

**Kriteria:** timer akurat ±1 detik setelah 5 menit, termasuk saat pindah aplikasi, di Android & iOS.

---

## Sprint 3 — Resep & Offline

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-30 | Database lokal IndexedDB (Dexie.js) + skema `Recipe` | M | [x] |
| TK-31 | Layar **Simpan resep** (nama, biji, roastery, catatan, rating) | M | [x] |
| TK-32 | Layar **Daftar resep**: cari, filter per metode, buka resep ke kalkulator | M | [x] |
| TK-33 | Edit & hapus resep (dengan konfirmasi) | S | [x] |
| TK-34 | PWA: manifest, ikon, service worker, bisa di-install | M | [x] |
| TK-35 | Uji mode pesawat: semua fitur jalan tanpa internet | S | [x] |
| TK-36 | Ekspor / impor resep ke file JSON (cadangan manual) | S | [x] |

**Kriteria:** app bisa di-install di HP, resep tersimpan dan tetap ada setelah app ditutup, semuanya jalan offline.

---

## Sprint 4 — Polish & Beta

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-40 | Layar **Pengaturan**: bahasa, satuan (g/oz, ml/fl oz, °C/°F), tema | M | [x] |
| TK-41 | Dark mode | S | [x] |
| TK-42 | Aksesibilitas: kontras warna, ukuran tombol ≥ 44px, label pembaca layar | S | [x] |
| TK-43 | Layar onboarding singkat (3 slide) untuk pemula | S | [x] |
| TK-44 | Rekrut 10–20 beta tester + form masukan (Google Form sudah tertaut di Pengaturan → Kirim masukan) | S | [ ] |
| TK-45 | Perbaikan bug dari hasil beta | L | [ ] |
| TK-45a | Masukan beta #1: kalkulator dua tab. **Takaran** (pilih ukuran gelas + jumlah gelas + Ringan/Normal/Pekat, angka dikunci) sebagai default, dan **Eksperimen** (isi bebas + slider ratio + 4:6). Tab terakhir diingat | M | [x] |
| TK-45b | Masukan beta #2: form masukan **di dalam aplikasi** (Pengaturan → Kirim masukan): Android/iOS + saran, dikirim ke Google Form di belakang layar, antre saat offline | S | [x] |
| TK-45c | Tab **Beans** + pilih beans sebelum seduh: jenis (arabika/robusta/liberika), proses (washed, natural, honey, giling basah, anaerob), sangrai → suhu air kalkulator, timer, dan resep ikut menyesuaikan | M | [x] |
| TK-45d | Eksperimen bisa diatur semua: suhu, gilingan (+ klik grinder), total waktu, dan jadwal tuang (waktu, jenis langkah, target timbangan; tambah/hapus, sesuaikan ke total air). Ikut ke timer dan resep; espresso/moka/cold brew bisa punya timer lewat langkah sendiri | M | [x] |
| TK-46 | Rilis v1.0 | S | [ ] |

**Kriteria:** ≥ 20 beta tester, ≥ 60% menyimpan minimal 1 resep, tidak ada bug kritis.

---

## Parkir (setelah MVP)

- Brew log & grafik riwayat seduhan
- Database biji kopi & roastery lokal
- Skala porsi (1 cangkir → banyak orang)
- Share resep via link / QR
- Kalkulator TDS / extraction yield
- Timbangan Bluetooth (butuh versi native)
