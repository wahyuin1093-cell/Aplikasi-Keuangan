const form = document.getElementById('form-transaksi');
const pilihBulan = document.getElementById('pilih-bulan');
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

// Set otomatis tanggal hari ini & bulan berjalan saat ini (Format: YYYY-MM)
const hariIni = new Date();
const tahunBulanSekarang = hariIni.toISOString().slice(0, 7);
pilihBulan.value = tahunBulanSekarang;
inputTanggal.valueAsDate = hariIni;

let daftarTransaksi = JSON.parse(localStorage.getItem('catatanKeuanganV2')) || [];

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

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

  const bulanDipilih = pilihBulan.value; // Contoh: "2026-11"
  const modeFilter = filterTampilan.value;

  daftarTransaksi.forEach((transaksi, index) => {
    // Saring hanya transaksi yang cocok dengan bulan yang sedang dipilih
    if (!transaksi.tanggal.startsWith(bulanDipilih)) return;

    // Hitung total khusus untuk bulan yang dipilih
    if (transaksi.jenis === 'pemasukan') {
      totalMasuk += transaksi.nominal;
    } else {
      totalKeluar += transaksi.nominal;
      if (transaksi.sifat === 'bocor') {
        totalBocor += transaksi.nominal;
      }
      pengeluaranPerKategori[transaksi.kategori] = (pengeluaranPerKategori[transaksi.kategori] || 0) + transaksi.nominal;
    }

    // Terapkan filter jenis/sifat
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

  // Update Kartu Saldo Bulanan
  const sisaSaldo = totalMasuk - totalKeluar;
  teksSaldo.innerText = 'Sisa Saldo: ' + formatRupiah(sisaSaldo);
  teksPemasukan.innerText = 'Pemasukan: ' + formatRupiah(totalMasuk);
  teksPengeluaran.innerText = 'Pengeluaran: ' + formatRupiah(totalKeluar);

  // Update Radar Kebocoran Bulanan
  const persenBocor = totalKeluar > 0 ? Math.round((totalBocor / totalKeluar) * 100) : 0;
  teksTotalBocor.innerText = `${formatRupiah(totalBocor)} (${persenBocor}% dari pengeluaran)`;

  let kategoriTerbesar = '';
  let nominalTerbesar = 0;
  for (const [kat, nom] of Object.entries(pengeluaranPerKategori)) {
    if (nom > nominalTerbesar) {
      nominalTerbesar = nom;
      kategoriTerbesar = kat;
    }
  }

  if (kategoriTerbesar) {
    teksKategoriTerboros.innerText = `Pengeluaran terbesar bulan ini: ${kategoriTerbesar} (${formatRupiah(nominalTerbesar)})`;
  } else {
    teksKategoriTerboros.innerText = 'Belum ada pengeluaran di bulan ini.';
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

  // Otomatis sesuaikan tampilan periode ke bulan transaksi yang baru diinput
  pilihBulan.value = tanggal.slice(0, 7);

  inputKeterangan.value = '';
  inputNominal.value = '';
  perbaruiTampilan();
});

function hapusTransaksi(index) {
  daftarTransaksi.splice(index, 1);
  perbaruiTampilan();
}

// Perbarui layar setiap kali periode bulan atau filter diganti
pilihBulan.addEventListener('change', perbaruiTampilan);
filterTampilan.addEventListener('change', perbaruiTampilan);

// Unduh CSV khusus untuk bulan yang sedang dipilih
btnEkspor.addEventListener('click', function() {
  const bulanDipilih = pilihBulan.value;
  const dataBulanIni = daftarTransaksi.filter(t => t.tanggal.startsWith(bulanDipilih));

  if (dataBulanIni.length === 0) {
    alert('Belum ada data transaksi di bulan ini untuk diunduh.');
    return;
  }

  let csvContent = "Tanggal,Jenis,Kategori,Sifat,Keterangan,Nominal\n";
  dataBulanIni.forEach(t => {
    const ketBersih = t.keterangan.replace(/,/g, ' ');
    csvContent += `${t.tanggal},${t.jenis},${t.kategori},${t.sifat},${ketBersih},${t.nominal}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `laporan-keuangan-${bulanDipilih}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

perbaruiTampilan();