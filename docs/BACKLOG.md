# Backlog Takar Kopi

Ukuran tiket: **S** = ≤ ½ hari · **M** = 1–2 hari · **L** = 3+ hari

Status: `[ ]` belum · `[~]` dikerjakan · `[x]` selesai

---

## Sprint 0 — Riset & Desain (1 minggu)

| ID | Tiket | Ukuran | Status |
|---|---|---|---|
| TK-01 | Wireframe 5 layar utama (pilih metode, kalkulator, timer, simpan resep, daftar resep) | M | [x] |
| TK-02 | Validasi tabel takaran default ke 2–3 barista / home brewer | M | [ ] |
| TK-03 | Tentukan nama final aplikasi, logo sederhana, dan warna | S | [ ] |
| TK-04 | Wireframe layar Pengaturan (bahasa, satuan, tema) | S | [x] |
| TK-05 | Tulis teks UI dalam Bahasa Indonesia & Inggris → `docs/TEKS-UI.md` | S | [x] |
| TK-06 | Wireframe layar Panduan gilingan + bagian grind size di kalkulator | S | [x] |
| TK-07 | Validasi angka klik grinder ke pemilik grinder / barista | S | [ ] |

**Kriteria selesai Sprint 0:** wireframe disetujui, tabel takaran sudah dicek barista, daftar teks UI dua bahasa siap.

---

## Sprint 1 — Fondasi & Kalkulator

| ID | Tiket | Ukuran |
|---|---|---|
| TK-10 | Setup proyek: React + TypeScript + Vite + Tailwind, linting, struktur folder | S |
| TK-11 | Deploy otomatis ke Vercel dari branch `master` | S |
| TK-12 | Sistem i18n (file `id` & `en`), tombol ganti bahasa, simpan pilihan | M |
| TK-13 | Data metode seduh (9 metode: ratio, suhu, gilingan, waktu, langkah) | M |
| TK-14 | Layar **Pilih metode** (grid metode + resep terakhir) | M |
| TK-15 | Layar **Kalkulator**: input kopi ↔ air dua arah, slider ratio, parameter | L |
| TK-16 | Logika khusus: espresso (dose → yield), Japanese iced (60% air panas / 40% es), cold brew (jam) | M |
| TK-17 | Unit test untuk semua rumus takaran | M |
| TK-18 | Panduan ukuran gilingan (6 level) + jumlah klik grinder manual (Comandante C40, Timemore C2/C3, Kingrinder K6, 1Zpresso Q2, 1Zpresso JX-Pro, Hario Skerton Pro) + opsi "grinder lain" dengan klik isi sendiri | M |

**Kriteria:** user bisa pilih metode dan langsung dapat takaran yang benar di HP, dalam 2 bahasa.

---

## Sprint 2 — Timer Seduh

| ID | Tiket | Ukuran |
|---|---|---|
| TK-20 | Generator jadwal tuang dari resep (bloom + tuangan, target berat kumulatif) | M |
| TK-21 | Layar **Timer**: waktu berjalan, langkah aktif, target gram, progress bar | L |
| TK-22 | Kontrol jeda / lanjut / langkah berikut / ulang | M |
| TK-23 | Bunyi + getar di tiap pergantian langkah (bisa dimatikan) | S |
| TK-24 | Layar tetap menyala saat timer jalan (Wake Lock API) | S |
| TK-25 | Timer tetap akurat walau app diminimize (hitung dari jam mulai, bukan interval) | M |
| TK-26 | Preset V60 metode 4:6 (Tetsu Kasuya) | S |

**Kriteria:** timer akurat ±1 detik setelah 5 menit, termasuk saat pindah aplikasi, di Android & iOS.

---

## Sprint 3 — Resep & Offline

| ID | Tiket | Ukuran |
|---|---|---|
| TK-30 | Database lokal IndexedDB (Dexie.js) + skema `Recipe` | M |
| TK-31 | Layar **Simpan resep** (nama, biji, roastery, catatan, rating) | M |
| TK-32 | Layar **Daftar resep**: cari, filter per metode, buka resep ke kalkulator | M |
| TK-33 | Edit & hapus resep (dengan konfirmasi) | S |
| TK-34 | PWA: manifest, ikon, service worker, bisa di-install | M |
| TK-35 | Uji mode pesawat: semua fitur jalan tanpa internet | S |
| TK-36 | Ekspor / impor resep ke file JSON (cadangan manual) | S |

**Kriteria:** app bisa di-install di HP, resep tersimpan dan tetap ada setelah app ditutup, semuanya jalan offline.

---

## Sprint 4 — Polish & Beta

| ID | Tiket | Ukuran |
|---|---|---|
| TK-40 | Layar **Pengaturan**: bahasa, satuan (g/oz, ml/fl oz, °C/°F), tema | M |
| TK-41 | Dark mode | S |
| TK-42 | Aksesibilitas: kontras warna, ukuran tombol ≥ 44px, label pembaca layar | S |
| TK-43 | Layar onboarding singkat (3 slide) untuk pemula | S |
| TK-44 | Rekrut 10–20 beta tester + form masukan | S |
| TK-45 | Perbaikan bug dari hasil beta | L |
| TK-46 | Rilis v1.0 | S |

**Kriteria:** ≥ 20 beta tester, ≥ 60% menyimpan minimal 1 resep, tidak ada bug kritis.

---

## Parkir (setelah MVP)

- Brew log & grafik riwayat seduhan
- Database biji kopi & roastery lokal
- Skala porsi (1 cangkir → banyak orang)
- Share resep via link / QR
- Kalkulator TDS / extraction yield
- Timbangan Bluetooth (butuh versi native)
