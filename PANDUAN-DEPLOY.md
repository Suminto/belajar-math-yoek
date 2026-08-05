# Panduan Deploy — Situs Belajar Matematika

Situs ini punya 2 kolom:
- **Kolom 1 (tetap)**: Home, Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang, About.
- **Kolom 2 (dinamis)**: saat salah satu domain diklik, muncul "tangga" Fase A–F. Klik satu fase, kolom yang sama berubah menampilkan isi materi fase tersebut.

Semua isi materi **kosong dulu** dan bisa diisi bertahap lewat panel admin (`/admin`) tanpa perlu koding lagi.

## Struktur folder

```
index.html          -> halaman utama (2 kolom)
css/style.css        -> tampilan (dark mode)
js/app.js            -> logika navigasi & render konten
content/             -> semua isi materi (JSON), ini yang diedit admin
  home.json
  about.json
  bilangan.json
  aljabar.json
  pengukuran.json
  geometri.json
  analisis-data-peluang.json
admin/
  index.html         -> panel admin (Decap CMS)
  config.yml         -> definisi kolom-kolom yang bisa diedit
netlify.toml
```

## Langkah 1 — Push ke GitHub

1. Buat repository baru di GitHub, misalnya `belajar-matematika`.
2. Di folder proyek ini, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Situs awal belajar matematika"
   git branch -M main
   git remote add origin https://github.com/USERNAME/belajar-matematika.git
   git push -u origin main
   ```

## Langkah 2 — Deploy ke Netlify

1. Login ke [app.netlify.com](https://app.netlify.com).
2. Klik **Add new site → Import an existing project**.
3. Pilih repo `belajar-matematika` dari GitHub.
4. Build settings dibiarkan default (tidak perlu build command, publish directory = `.`), karena situs ini murni HTML/CSS/JS statis.
5. Klik **Deploy**. Tunggu sampai selesai, lalu catat URL situsnya, misalnya `https://belajar-matematika-xxxx.netlify.app`.

## Langkah 3 — Aktifkan panel admin (Netlify Identity + Git Gateway)

Panel `/admin` memakai Decap CMS dengan backend `git-gateway`, jadi perlu Netlify Identity:

1. Di dashboard situs Netlify → menu **Identity** → klik **Enable Identity**.
2. Di bagian **Registration**, pilih **Invite only** (supaya tidak sembarang orang bisa daftar).
3. Scroll ke **Services → Git Gateway** → klik **Enable Git Gateway**.
4. Kembali ke tab **Identity → Invite users**, masukkan email Suminto sendiri, lalu kirim undangan.
5. Cek email, klik link undangan, buat password. Ini akun login untuk `/admin`.

## Langkah 4 — Mengisi materi lewat admin

1. Buka `https://NAMA-SITUS-ANDA.netlify.app/admin`.
2. Login pakai email & password dari Langkah 3.
3. Di sebelah kiri panel admin akan muncul koleksi: **Halaman Home**, **Halaman About**, **Bilangan**, **Aljabar**, **Pengukuran**, **Geometri**, **Analisis Data dan Peluang**.
4. Buka salah satu domain (misalnya **Bilangan**) → akan ada daftar **Fase (A–F)**. Klik satu fase, isi:
   - **Judul Materi** — judul topik untuk fase tersebut.
   - **Ringkasan Singkat** — 1–2 kalimat ringkasan.
   - **Konten (Markdown)** — isi materi lengkap. Bisa pakai `## Sub Judul`, `**tebal**`, `*miring*`, dan daftar dengan `- item`.
   - **Poin-Poin Materi** — daftar poin singkat (opsional), tampil sebagai bullet list di atas konten.
5. Klik **Publish**. Perubahan otomatis ter-commit ke GitHub dan Netlify akan build ulang situs (biasanya selesai dalam 1–2 menit).

Fase yang belum diisi otomatis ditandai **"Belum diisi"** di tangga fase, jadi terlihat jelas bagian mana yang masih kosong.

## Catatan definisi Fase (Kurikulum Merdeka)

| Fase | Jenjang |
|------|---------|
| A | Kelas 1–2 SD |
| B | Kelas 3–4 SD |
| C | Kelas 5–6 SD |
| D | Kelas 7–9 SMP |
| E | Kelas 10 SMA/SMK |
| F | Kelas 11–12 SMA/SMK |

Label ini sudah otomatis terisi di setiap file JSON, tapi tetap bisa diedit lewat admin kalau perlu disesuaikan.

## Uji coba lokal (opsional, sebelum push)

Karena `index.html` memakai `fetch()` untuk membaca file JSON di `content/`, harus dibuka lewat server lokal (bukan `file://`), contoh:

```bash
cd belajar-matematika
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser.
