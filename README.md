# ☕ Coffee Brewing

Aplikasi web (PWA) untuk menghitung takaran kopi manual brew, espresso, dan metode seduh lainnya, lengkap dengan timer seduh bertahap dan penyimpanan resep.

> Status: **v1.0.0 rilis**. Lihat [CHANGELOG.md](CHANGELOG.md) untuk daftar fitur lengkap.

## Menjalankan di komputer

Butuh Node.js 22 atau lebih baru.

```bash
npm install
npm run dev        # buka http://localhost:5173
npm test           # unit test
npm run lint       # cek gaya kode
npm run build      # build produksi ke folder dist/
```

## Struktur kode

| Folder | Isi |
|---|---|
| `src/data/` | Data metode seduh, porsi, level gilingan, klik grinder, beans, dan origin kopi |
| `src/lib/brew.ts` | Rumus takaran & jadwal tuang (murni, ada unit test) |
| `src/lib/timer.ts` | Logika timer seduh berbasis jam |
| `src/lib/recipes.ts` | Database resep di perangkat (IndexedDB via Dexie) + cadangan JSON |
| `src/i18n/` | Teks Indonesia (`id.json`) & Inggris (`en.json`) |
| `src/screens/` | Layar aplikasi |
| `src/components/` | Komponen UI bersama |
| `docs/` | Backlog dan daftar teks UI |

## Keputusan Proyek

| Topik | Keputusan |
|---|---|
| Platform | PWA (web app yang bisa di-install di HP, jalan offline) |
| Monetisasi | Gratis total |
| Nama | Coffee Brewing |
| Bahasa | Indonesia (default) + Inggris |
| Backend | Tidak ada untuk MVP, semua data tersimpan di perangkat |

## Fitur MVP

1. **Pilih metode seduh**: V60, Kalita Wave, Chemex, French Press, AeroPress, Espresso, Moka Pot, Cold Brew, Japanese Iced
2. **Kalkulator takaran dua arah**: gram kopi ↔ ml air, ratio bisa digeser
3. **Parameter rekomendasi**: suhu air, ukuran gilingan, total waktu
4. **Timer seduh bertahap**: bloom → tuangan berikutnya, dengan target berat kumulatif
5. **Simpan resep**: nama, biji kopi, roastery, catatan rasa, rating
6. **Offline** dan **dua bahasa**

Setelah beta, v1.0 juga membawa mode Takaran/Eksperimen, pilih beans sebelum seduh, tab Beans, cari biji kopi (62 origin), jadwal tuang yang bisa diatur sendiri, dan masukan dari dalam aplikasi.

## Takaran Default (titik awal, bisa diubah user)

| Metode | Ratio (kopi:air) | Suhu | Gilingan | Waktu |
|---|---|---|---|---|
| V60 / Kalita | 1:15 – 1:17 | 90–96°C | Medium-fine | 2:30–3:30 |
| Chemex | 1:15 – 1:17 | 92–96°C | Medium-coarse | 3:30–4:30 |
| French Press | 1:12 – 1:15 | 93–96°C | Coarse | 4:00 |
| AeroPress | 1:12 – 1:16 | 80–92°C | Fine-medium | 1:30–2:30 |
| Espresso | 1:2 (18g → 36g) | 90–94°C | Fine | 25–30 detik |
| Ristretto / Lungo | 1:1–1:1.5 / 1:3 | 90–94°C | Fine | — |
| Moka Pot | ±1:7 – 1:10 | Air panas awal | Fine-medium | Sampai berdesis |
| Cold Brew | 1:8 (konsentrat) / 1:12–1:15 | Air dingin | Coarse | 12–24 jam |
| Japanese Iced | 1:15 total, 40% berupa es | 92–96°C | Medium-fine | 2:30–3:00 |

### Rumus

```
air (ml)        = kopi (g) × ratio
kopi (g)        = air (ml) ÷ ratio
espresso yield  = dose (g) × ratio
iced: es (g)    = total air × 0.4 ; air panas = total air × 0.6
bloom           = kopi × 2–3 (ml), 30–45 detik
```

## Rencana Teknologi

| Lapisan | Pilihan |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind |
| Penyimpanan | IndexedDB (Dexie.js) |
| Offline / install | Service Worker (vite-plugin-pwa) |
| Bahasa | i18n dengan file `id` dan `en` |
| Hosting | Vercel |

## Timeline (sprint 2 minggu)

| Sprint | Fokus |
|---|---|
| 0 (1 minggu) | Wireframe 5 layar utama, validasi takaran ke barista, backlog |
| 1 | Setup proyek, i18n, pilih metode, kalkulator |
| 2 | Timer seduh bertahap |
| 3 | Simpan resep, offline, PWA bisa di-install |
| 4 | Polish, dark mode, beta test 10–20 user |

## Fase Lanjut (setelah MVP)

- Brew log dan grafik riwayat seduhan
- Database roastery lokal
- Share resep via link/QR
- Kalkulator TDS / extraction yield
- Koneksi timbangan Bluetooth (butuh versi aplikasi native)
