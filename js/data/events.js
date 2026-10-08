// js/data/events.js
// Event bersejarah + event acak. Semua berdasarkan sejarah nyata
// industri semikonduktor 1995-2025.

const HISTORICAL_EVENTS = [
  {
    year: 1995, month: 1,
    id: 'pc_era',
    title: 'Era PC Dimulai',
    desc: 'Windows 95 dirilis. Permintaan CPU dan OS melonjak.',
    type: 'milestone',
    effects: { demand: { cpu: 1.3, os: 1.4 }, share: 0.01 },
  },
  {
    year: 1997, month: 5,
    id: 'mmx_era',
    title: 'SIMD Masuk Mainstream',
    desc: 'Instruksi MMX menjadi standar. Chip tanpa SIMD mulai tertinggal.',
    type: 'info',
    effects: { featureDemand: 1.3 },
  },
  {
    year: 1999, month: 8,
    id: 'gpu_revolution',
    title: 'Revolusi GPU',
    desc: 'GPU consumer pertama muncul. Pasar grafis terbuka.',
    type: 'milestone',
    effects: { demand: { gpu: 2.0 } },
  },
  {
    year: 2001, month: 3,
    id: 'dotcom_bust',
    title: 'Dot-com Bust',
    desc: 'Krisis teknologi global. Belanja perusahaan turun tajam.',
    type: 'bad',
    effects: { demand: { cpu: 0.75, os: 0.8, gpu: 0.85, server: 0.7 } },
  },
  {
    year: 2003, month: 4,
    id: 'laptop_era',
    title: 'Era Laptop',
    desc: 'Laptop mulai terjangkau. Mobilitas jadi prioritas.',
    type: 'milestone',
    effects: { demand: { laptop: 1.5 } },
  },
  {
    year: 2007, month: 1,
    id: 'smartphone_birth',
    title: 'Lahirnya Smartphone',
    desc: 'Ponsel pintar mengubah industri. Siapa cepat, dia dapat.',
    type: 'milestone',
    effects: { demand: { mobile: 2.5, smartphone: 2.5 }, share: 0.01 },
  },
  {
    year: 2008, month: 9,
    id: 'financial_crisis',
    title: 'Krisis Finansial Global',
    desc: 'Pasar melemah. Hanya yang efisien bisa bertahan.',
    type: 'bad',
    effects: { demand: { cpu: 0.7, os: 0.75, gpu: 0.7, laptop: 0.8, mobile: 0.9, smartphone: 0.85 } },
  },
  {
    year: 2010, month: 6,
    id: 'mobile_boom',
    title: 'Booming Mobile',
    desc: 'Smartphone dan tablet mendominasi konsumen.',
    type: 'milestone',
    effects: { demand: { mobile: 1.6, smartphone: 1.6, os: 1.2 } },
  },
  {
    year: 2013, month: 1,
    id: 'mobile_war',
    title: 'Perang Mobile',
    desc: 'Persaingan smartphone memanas. Margin turun.',
    type: 'warn',
    effects: { pricePressure: { smartphone: 0.85 } },
  },
  {
    year: 2017, month: 5,
    id: 'ai_era',
    title: 'Era AI & Data Center',
    desc: 'GPU jadi primadona. Permintaan AI meledak.',
    type: 'milestone',
    effects: { demand: { gpu: 1.8, server: 1.5, cpu: 1.2 } },
  },
  {
    year: 2020, month: 3,
    id: 'pandemic',
    title: 'Pandemi Global',
    desc: 'Work from home. Laptop dan chip langka, harga melambung.',
    type: 'warn',
    effects: { demand: { laptop: 1.7, cpu: 1.3, gpu: 1.4, smartphone: 1.1 } },
  },
  {
    year: 2022, month: 2,
    id: 'supply_crisis',
    title: 'Krisis Rantai Pasok',
    desc: 'Kelangkaan chip global. Semua produsen kewalahan.',
    type: 'bad',
    effects: { demand: { cpu: 0.85, gpu: 0.8, laptop: 0.85, smartphone: 0.9 }, costMult: 1.3 },
  },
  {
    year: 2024, month: 1,
    id: 'ai_boom',
    title: 'Ledakan AI Generatif',
    desc: 'Permintaan chip AI melampaui kapasitas produksi dunia.',
    type: 'milestone',
    effects: { demand: { gpu: 1.6, server: 1.4 } },
  },
  {
    year: 2025, month: 1,
    id: 'nm2_era',
    title: 'Era 2nm',
    desc: 'Teknologi paling canggih di planet ini. Hanya yang terdepan bisa bersaing.',
    type: 'milestone',
    effects: { demand: { cpu: 1.3, gpu: 1.3, smartphone: 1.2 }, share: 0.01 },
  },
];

// Event acak yang bisa terjadi kapan saja, peluang per turn ~2%
const RANDOM_EVENTS = [
  {
    id: 'poach',
    title: 'Engineer Dibajak',
    desc: 'Kompetitor menawarkan gaji lebih tinggi. Salah satu engineer loyalitasnya turun.',
    type: 'bad',
    effect: 'poach',
  },
  {
    id: 'viral',
    title: 'Produk Viral',
    desc: 'Produk terakhirmu viral di media. Permintaan naik sementara.',
    type: 'good',
    effect: 'viral',
  },
  {
    id: 'bug',
    title: 'Bug Kritis',
    desc: 'Ditemukan bug serius. Butuh biaya perbaikan.',
    type: 'bad',
    effect: 'bug',
  },
  {
    id: 'award',
    title: 'Penghargaan Industri',
    desc: 'Perusahaanmu menerima penghargaan. Reputasi naik.',
    type: 'good',
    effect: 'award',
  },
  {
    id: 'lawsuit',
    title: 'Gugatan Paten',
    desc: 'Digugat oleh kompetitor. Harus bayar denda.',
    type: 'bad',
    effect: 'lawsuit',
  },
  {
    id: 'subsidy',
    title: 'Subsidi Pemerintah',
    desc: 'Pemerintah memberi insentif untuk riset lokal.',
    type: 'good',
    effect: 'subsidy',
  },
];

function getHistoricalEvent(year, month) {
  return HISTORICAL_EVENTS.find(e => e.year === year && e.month === month) || null;
}

function getEventsForYear(year) {
  return HISTORICAL_EVENTS.filter(e => e.year === year);
}

function rollRandomEvent(rng = Math.random) {
  if (rng() > 0.03) return null; // ~3% per turn
  return RANDOM_EVENTS[Math.floor(rng() * RANDOM_EVENTS.length)];
}
