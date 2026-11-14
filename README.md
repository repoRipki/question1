# Teman Sejati? — Friendship Test

Website kuis persahabatan statis yang bisa dijalankan langsung di browser.

## Isi project
- `index.html` — halaman utama
- `css/style.css` — tampilan dan responsif mobile
- `js/app.js` — editor pertanyaan, pembuat link, kuis, dan perhitungan skor

## Menjalankan di Android
1. Ekstrak ZIP ini.
2. Buka `index.html` menggunakan browser.
3. Buat/edit bank pertanyaan.
4. Centang 10 pertanyaan yang ingin dipakai.
5. Tekan **Buat kuis 10 pertanyaan** lalu salin tautannya.

## Hosting agar teman bisa membuka link
Upload seluruh isi folder ini ke hosting static seperti GitHub Pages, Netlify, atau Cloudflare Pages. Pastikan `index.html`, folder `css`, dan folder `js` berada pada direktori yang sama.

## Catatan teknis
Versi ini tidak memakai backend atau database. Konfigurasi kuis disimpan di dalam URL (hash), jadi tautan kuis membawa 10 pertanyaan beserta kunci jawaban. Hasil peserta belum tersimpan otomatis ke dashboard pembuat; peserta dapat membagikan hasil melalui WhatsApp.
