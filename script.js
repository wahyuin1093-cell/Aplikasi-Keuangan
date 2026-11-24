const form = document.getElementById('form-transaksi');
const inputTanggal = document.getElementById('tanggal');
const selectJenis = document.getElementById('jenis');
const selectKategori = document.getElementById('kategori');
const areaSifat = document.getElementById('area-sifat');
const selectSifat = document.getElementById('sifat');
const inputKeterangan = document.getElementById('keterangan');
const inputNominal = document.getElementById('nominal');

const daftarRiwayat = document.getElementById('daftar-riwayat');
const teksSaldo = document.getElementById('sisa-saldo');
const teksPemasukan = document.getElementById('total-pemasukan');
const teksPengeluaran = document.getElementById('total-pengeluaran');
const teksTotalBocor = document.getElementById('total-bocor');
const teksKategoriTerboros = document.getElementById('kategori-terboros');

const filterTampilan = document.getElementById('filter-tampilan');
const btnEkspor = document.getElementById('btn-ekspor');

// Set tanggal hari ini secara otomatis di kolom tanggal
inputTanggal.valueAsDate = new Date();

// Ambil data dari memori browser
let daftarTransaksi = JSON.parse(localStorage.getItem('catatanKeuanganV2')) || [];

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

// Sembunyikan pilihan "Sifat Pengeluaran" jika yang dipilih adalah Pemasukan
selectJenis.addEventListener('change', function() {
  if (selectJenis.value === 'pemasukan') {
    areaSifat.style.display = 'none';
    selectKategori.value = 'Gaji / Pemasukan';
  } else {
    areaSifat.style.display = 'block';
    selectKategori.value = 'Makan & Minum';
  }
});

function perbaruiTampilan() {
  daftarRiwayat.innerHTML = '';

  let totalMasuk = 0;
  let totalKeluar = 0;
  let totalBocor = 0;
  let pengeluaranPerKategori = {};

  const modeFilter = filterTampilan.value;

  daftarTransaksi.forEach((transaksi, index) => {
    // Hitung total keseluruhan (tidak terpengaruh filter tampilan)
    if (transaksi.jenis === 'pemasukan') {
      totalMasuk += transaksi.nominal;
    } else {
      totalKeluar += transaksi.nominal;
      if (transaksi.sifat === 'bocor') {
        totalBocor += transaksi.nominal;
      }
      // Catat total per kategori pengeluaran untuk mencari kategori terboros
      pengeluaranPerKategori[transaksi.kategori] = (pengeluaranPerKategori[transaksi.kategori] || 0) + transaksi.nominal;
    }

    // Cek filter tampilan sebelum menampilkan baris ke layar
    if (modeFilter === 'bocor' && (transaksi.jenis !== 'pengeluaran' || transaksi.sifat !== 'bocor')) return;
    if (modeFilter === 'kebutuhan' && (transaksi.jenis !== 'pengeluaran' || transaksi.sifat !== 'kebutuhan')) return;
    if (modeFilter === 'pemasukan' && transaksi.jenis !== 'pemasukan') return;

    const item = document.createElement('li');
    const tanda = transaksi.jenis === 'pemasukan' ? '+' : '-';
    const kelasWarna = transaksi.jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran';

    let labelSifat = '';
    if (transaksi.jenis === 'pengeluaran') {
      labelSifat = transaksi.sifat === 'bocor'
        ? '<span class="badge-bocor">Potensi Bocor</span>'
        : '<span class="badge-wajib">Kebutuhan</span>';
    }

    item.innerHTML = `
      <div>
        <strong>${transaksi.keterangan}</strong> ${labelSifat}
        <div class="meta-transaksi">${transaksi.tanggal} • ${transaksi.kategori}</div>
      </div>
      <div style="text-align: right;">
        <span class="${kelasWarna}">${tanda} ${formatRupiah(transaksi.nominal)}</span><br>
        <button onclick="hapusTransaksi(${index})" style="width: auto; padding: 3px 8px; margin-top: 4px; background-color: #e53e3e; font-size: 11px;">Hapus</button>
      </div>
    `;

    daftarRiwayat.appendChild(item);
  });

  // Update Kartu Saldo
  const sisaSaldo = totalMasuk - totalKeluar;
  teksSaldo.innerText = 'Sisa Saldo: ' + formatRupiah(sisaSaldo);
  teksPemasukan.innerText = 'Pemasukan: ' + formatRupiah(totalMasuk);
  teksPengeluaran.innerText = 'Pengeluaran: ' + formatRupiah(totalKeluar);

  // Update Radar Kebocoran
  const persenBocor = totalKeluar > 0 ? Math.round((totalBocor / totalKeluar) * 100) : 0;
  teksTotalBocor.innerText = `${formatRupiah(totalBocor)} (${persenBocor}% dari pengeluaran)`;

  // Cari kategori pengeluaran terbesar
  let kategoriTerbesar = '';
  let nominalTerbesar = 0;
  for (const [kat, nom] of Object.entries(pengeluaranPerKategori)) {
    if (nom > nominalTerbesar) {
      nominalTerbesar = nom;
      kategoriTerbesar = kat;
    }
  }

  if (kategoriTerbesar) {
    teksKategoriTerboros.innerText = `Pengeluaran terbesar saat ini: ${kategoriTerbesar} (${formatRupiah(nominalTerbesar)})`;
  } else {
    teksKategoriTerboros.innerText = 'Belum ada pengeluaran tercatat.';
  }

  localStorage.setItem('catatanKeuanganV2', JSON.stringify(daftarTransaksi));
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  const tanggal = inputTanggal.value;
  const jenis = selectJenis.value;
  const kategori = selectKategori.value;
  const sifat = jenis === 'pengeluaran' ? selectSifat.value : '-';
  const keterangan = inputKeterangan.value.trim();
  const nominal = parseInt(inputNominal.value);

  if (!tanggal || keterangan === '' || isNaN(nominal) || nominal <= 0) {
    alert('Harap lengkapi tanggal, keterangan, dan nominal dengan benar!');
    return;
  }

  daftarTransaksi.unshift({
    tanggal,
    jenis,
    kategori,
    sifat,
    keterangan,
    nominal
  });

  inputKeterangan.value = '';
  inputNominal.value = '';
  perbaruiTampilan();
});

function hapusTransaksi(index) {
  daftarTransaksi.splice(index, 1);
  perbaruiTampilan();
}

// Jalankan ulang tampilan setiap kali filter diganti
filterTampilan.addEventListener('change', perbaruiTampilan);

// Fitur Ekspor Data ke CSV (bisa dibuka di Microsoft Excel / Google Sheets)
btnEkspor.addEventListener('click', function() {
  if (daftarTransaksi.length === 0) {
    alert('Belum ada data transaksi untuk diunduh.');
    return;
  }

  let csvContent = "Tanggal,Jenis,Kategori,Sifat,Keterangan,Nominal\n";
  daftarTransaksi.forEach(t => {
    const ketBersih = t.keterangan.replace(/,/g, ' '); // Hindari koma merusak kolom CSV
    csvContent += `${t.tanggal},${t.jenis},${t.kategori},${t.sifat},${ketBersih},${t.nominal}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'laporan-keuangan-pribadi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

perbaruiTampilan();