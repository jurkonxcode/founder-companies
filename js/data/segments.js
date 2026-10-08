// js/data/segments.js
// Segmen pasar. Setiap segmen punya preferensi berbeda terhadap
// performa, TDP, harga, dan fitur chip.

const SEGMENTS = [
  {
    id: 'budget_pc',
    name: 'Budget PC',
    icon: '🖥️',
    year: 1995,
    marketSize: 2000000,       // total unit/tahun
    growthRate: 0.03,
    priceWeight: 0.55,         // sangat sensitif harga
    perfWeight: 0.20,
    tdpWeight: 0.10,
    featureWeight: 0.15,
    priceCeiling: 150,         // di atas ini, konsumen kabur
    priceSweet: 80,
  },
  {
    id: 'enthusiast',
    name: 'Enthusiast PC',
    icon: '⚡',
    year: 1995,
    marketSize: 300000,
    growthRate: 0.05,
    priceWeight: 0.15,
    perfWeight: 0.55,
    tdpWeight: 0.15,
    featureWeight: 0.15,
    priceCeiling: 800,
    priceSweet: 350,
  },
  {
    id: 'server',
    name: 'Server & Workstation',
    icon: '🗄️',
    year: 1997,
    marketSize: 120000,
    growthRate: 0.08,
    priceWeight: 0.10,
    perfWeight: 0.40,
    tdpWeight: 0.20,
    featureWeight: 0.30,       // butuh fitur ECC, core banyak, IO
    priceCeiling: 3000,
    priceSweet: 1200,
  },
  {
    id: 'mobile',
    name: 'Mobile & Embedded',
    icon: '📱',
    year: 2007,
    marketSize: 1500000,
    growthRate: 0.25,          // tumbuh cepat
    priceWeight: 0.30,
    perfWeight: 0.20,
    tdpWeight: 0.40,           // sangat sensitif TDP
    featureWeight: 0.10,
    priceCeiling: 250,
    priceSweet: 120,
  },
  {
    id: 'ai_datacenter',
    name: 'AI & Data Center',
    icon: '🤖',
    year: 2017,
    marketSize: 400000,
    growthRate: 0.45,          // meledak
    priceWeight: 0.05,
    perfWeight: 0.45,
    tdpWeight: 0.10,
    featureWeight: 0.40,       // butuh SIMD lebar, memory bandwidth
    priceCeiling: 15000,
    priceSweet: 6000,
  },
];

function getSegment(id) {
  return SEGMENTS.find(s => s.id === id) || null;
}

function getAvailableSegments(year) {
  return SEGMENTS.filter(s => s.year <= year);
}

// Hitung "kecocokan" chip dengan segmen (0-1).
// Semakin tinggi, semakin laku di segmen itu.
function calcSegmentFit(segment, chip) {
  // Skor harga: 1.0 kalau di bawah sweet, turun di atas ceiling
  let priceScore;
  if (chip.price <= segment.priceSweet) {
    priceScore = 1.0;
  } else if (chip.price >= segment.priceCeiling) {
    priceScore = 0.0;
  } else {
    const range = segment.priceCeiling - segment.priceSweet;
    priceScore = 1.0 - (chip.price - segment.priceSweet) / range;
  }

  // Skor performa: normalisasi relatif terhadap referensi tahun
  const perfScore = Math.min(1.0, chip.perfScore / (segment.perfWeight > 0 ? 300 : 1));

  // Skor TDP: makin rendah makin baik
  const tdpTarget = 15 + (1 - segment.tdpWeight) * 100;
  const tdpScore = chip.tdp <= tdpTarget
    ? 1.0
    : Math.max(0, 1.0 - (chip.tdp - tdpTarget) / (tdpTarget * 2));

  // Skor fitur (SIMD, memory bandwidth, core count)
  const featureScore = Math.min(1.0, (chip.featureScore || 0) / 100);

  return (
    priceScore  * segment.priceWeight +
    perfScore   * segment.perfWeight +
    tdpScore    * segment.tdpWeight +
    featureScore* segment.featureWeight
  );
}
