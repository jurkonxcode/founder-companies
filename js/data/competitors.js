// js/data/competitors.js
// 8 rival AI dengan kepribadian berbeda. Fiktif.

const COMPETITORS = [
  {
    id: 'nexus',
    name: 'Nexus Corp',
    icon: '🟦',
    color: '#4f8cff',
    founded: 1995,
    startingShare: 0.15,
    aggression: 1.2,       // sering rilis produk
    quality: 1.05,         // kualitas chip tinggi
    pricing: 0.95,         // harga agresif
    focus: ['cpu', 'gpu'],
    personality: 'Perusahaan besar yang agresif. Fokus pada CPU dan GPU.',
  },
  {
    id: 'helios',
    name: 'Helios Semiconductor',
    icon: '🟨',
    color: '#d29922',
    founded: 1995,
    startingShare: 0.12,
    aggression: 0.9,
    quality: 1.0,
    pricing: 1.1,
    focus: ['cpu', 'mobile'],
    personality: 'Konservatif tapi stabil. Kuat di mobile.',
  },
  {
    id: 'vertex',
    name: 'Vertex Systems',
    icon: '🟪',
    color: '#a371f7',
    founded: 1995,
    startingShare: 0.14,
    aggression: 1.0,
    quality: 0.95,
    pricing: 0.90,
    focus: ['os', 'laptop', 'mobile'],
    personality: 'Integrator sistem. Kuat di software dan ekosistem.',
  },
  {
    id: 'orion',
    name: 'Orion Microsystems',
    icon: '🟧',
    color: '#f0883e',
    founded: 1997,
    startingShare: 0.08,
    aggression: 1.1,
    quality: 1.10,
    pricing: 1.15,
    focus: ['cpu', 'server'],
    personality: 'Premium. Chip mahal tapi performa terbaik.',
  },
  {
    id: 'atlas',
    name: 'Atlas Foundry',
    icon: '🟩',
    color: '#3fb950',
    founded: 1999,
    startingShare: 0.06,
    aggression: 0.7,
    quality: 0.90,
    pricing: 0.80,         // murah
    focus: ['cpu', 'gpu'],
    personality: 'Produsen massal. Murah tapi kualitas biasa.',
  },
  {
    id: 'vortex',
    name: 'Vortex Graphics',
    icon: '🟥',
    color: '#f85149',
    founded: 2000,
    startingShare: 0.05,
    aggression: 1.3,
    quality: 1.05,
    pricing: 1.0,
    focus: ['gpu'],
    personality: 'Spesialis GPU. Rilis cepat, inovasi tinggi.',
  },
  {
    id: 'kestrel',
    name: 'Kestrel Mobility',
    icon: '🩵',
    color: '#39c5cf',
    founded: 2007,
    startingShare: 0.04,
    aggression: 1.4,
    quality: 1.0,
    pricing: 0.85,
    focus: ['mobile', 'os'],
    personality: 'Pemain baru di mobile. Cepat dan murah.',
  },
  {
    id: 'prometheus',
    name: 'Prometheus AI',
    icon: '🟣',
    color: '#bc8cff',
    founded: 2017,
    startingShare: 0.03,
    aggression: 1.5,
    quality: 1.15,
    pricing: 1.2,
    focus: ['gpu', 'server'],
    personality: 'Pendatang di era AI. Fokus pada chip AI kelas atas.',
  },
];

function getCompetitor(id) {
  return COMPETITORS.find(c => c.id === id) || null;
}

function getActiveCompetitors(year) {
  return COMPETITORS.filter(c => c.founded <= year);
}

// Inisialisasi market share kompetitor pada tahun tertentu.
// Kompetitor yang belum lahir tidak punya share.
function initCompetitorShares(year) {
  const active = getActiveCompetitors(year);
  return active.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    share: c.startingShare,
    products: [],
  }));
}
