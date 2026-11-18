# Sunday.id

Game simulasi bergaya "crash" dengan tema layangan. Sebuah layangan terbang naik dan pengali (kali) bertambah terus, sampai benangnya putus di titik acak. Pemain harus **cash out** sebelum layangan putus.

> **Penting:** ini hanya simulasi untuk belajar dan hiburan. Rupiah di game adalah **saldo virtual**. Tidak ada deposit, penarikan, pembayaran, atau uang sungguhan. Game peluang dengan taruhan uang sungguhan dilarang di Indonesia, jadi jangan dikembangkan menjadi layanan taruhan nyata.

## Cara menjalankan

1. Simpan `index.html`, `style.css`, dan `script.js` dalam **satu folder**.
2. Buka `index.html` di browser (klik dua kali). Tidak perlu server, instalasi, atau koneksi internet.

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Kerangka halaman: kanvas game, panel taruhan, riwayat, dan statistik |
| `style.css` | Tampilan, tema terang/gelap otomatis, dan animasi antarmuka |
| `script.js` | Logika game, gambar kanvas, suara, dan riwayat |

## Cara bermain

1. Pilih jumlah taruhan: chip cepat (Rp10.000, Rp50.000, Rp100.000, Rp250.000) atau ketik nominal sendiri di **Taruhan manual**.
2. Tekan **PASANG TARUHAN** selama hitungan mundur 5 detik sebelum ronde dimulai. Tombol yang sama berubah menjadi **BATALKAN TARUHAN** jika Anda berubah pikiran.
3. Saat layangan terbang, tekan **CASH OUT** kapan saja untuk mengambil `taruhan × kali saat itu`.
4. Jika layangan putus sebelum Anda cash out, taruhan hangus.

### Kontrol

- **Chip taruhan:** pilihan nominal cepat.
- **Taruhan manual:** nominal bebas, minimal Rp1.000. Tombol **½** membagi dua, **2×** menggandakan, dan **Maks** memasang seluruh saldo (dibulatkan ke ribuan). Pesan merah muncul jika nominal terlalu kecil atau melebihi saldo.
- **Cash out otomatis:** isi angka kali (minimal 1,1) agar cash out terjadi sendiri. Kosongkan untuk cash out manual.
- **🔊:** menyalakan atau mematikan suara.
- **🎮 / 🪵 / 💧:** mengganti gaya suara saat kali bertambah (Arcade, Marimba, Tetes air).
- **Isi ulang:** muncul saat saldo di bawah Rp1.000, menambah Rp1.000.000 saldo virtual.
- **Hapus:** mengosongkan riwayat taruhan.

## Fitur

- Saldo dan taruhan dalam format Rupiah (contoh: `Rp1.250.000`).
- **Riwayat taruhan:** nomor ronde, taruhan, kali, dan hasil (hijau untuk menang, merah untuk kalah). Menyimpan 50 catatan terakhir.
- **Hasil ronde terakhir:** 14 titik putus terakhir, berwarna biru (di bawah 2x), ungu (2x sampai 10x), dan pink (10x ke atas).
- **Statistik:** jumlah ronde yang dimainkan, total dipasang, hasil bersih, dan nilai harapan (−3%).
- **Suara:** dibuat langsung oleh browser lewat Web Audio, tanpa file audio. Ada angin yang berhembus, bunyi tiap kali bertambah, akor di 2x/5x/10x, bunyi cash out, benang putus, dan kicau burung saat menunggu.
- **Animasi:** langit berubah dari biru ke jingga lalu senja, matahari berdenyut, burung dan awan bergerak, layangan bergerak mulus mengikuti kali, angka kali "membesar" saat bertambah, percikan bintang, cincin di 2x/5x/10x, konfeti saat cash out, layar bergetar saat putus, dan saldo yang berhitung naik-turun.
- Tema terang dan gelap mengikuti pengaturan perangkat. Animasi dikurangi otomatis jika perangkat memakai pengaturan "kurangi gerakan".
- Tampilan responsif untuk HP dan desktop.

## Cara kerja game

- **Titik putus** ditentukan acak tiap ronde: `floor(97 / (1 − r)) / 100`, dengan `r` angka acak antara 0 dan 1, minimal 1,00x dan maksimal 500x.
- Angka **97** berarti margin rumah 3%. Dalam jangka panjang saldo Anda cenderung **berkurang**, apa pun strateginya. Itulah cara kerja game semacam ini.
- **Pengali** naik secara eksponensial: `kali = e^(0,1 × detik)`.
- Satu siklus ronde: hitung mundur 5 detik, terbang sampai putus, lalu jeda 3 detik menampilkan hasil.

## Mengubah pengaturan

Pengaturan yang paling sering diubah:

| Yang ingin diubah | Lokasi |
|---|---|
| Saldo awal dan taruhan minimum | `SALDO_AWAL` dan `MIN_BET` di bagian atas `script.js` |
| Pilihan chip taruhan | atribut `data-b` pada tombol chip di `index.html` (ubah juga teksnya) |
| Margin rumah | angka `97` di fungsi `genCrash` di `script.js` |
| Kecepatan naiknya kali | angka `.1` di `Math.exp(.1*t)` di fungsi `draw` |
| Lama hitung mundur | angka `5` di `5-(now-S.tw)/1000` di fungsi `draw` |
| Gaya suara awal | variabel `popStyle` (0 Arcade, 1 Marimba, 2 Tetes air) |
| Warna tema | variabel CSS di bagian atas `style.css` |

## Catatan teknis

- Murni HTML, CSS, dan JavaScript tanpa pustaka luar.
- Browser baru mengizinkan suara setelah ada satu ketukan atau klik di halaman, jadi suara baru terdengar setelah Anda menekan sesuatu.
- Semua data (saldo, riwayat, statistik) hanya tersimpan di memori halaman dan hilang saat halaman dimuat ulang.