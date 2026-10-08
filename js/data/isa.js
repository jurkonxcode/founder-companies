/// js/data/isa.js
// Instruction Set Architecture — fondasi chip.
// Memilih ISA adalah keputusan jangka panjang: sekali pilih, susah ganti.

const ISA_LIST = [
  {
    id: 'x86',
    name: 'x86',
    year: 1995,               // sudah ada sejak awal
    licenseCost: 0,
    difficulty: 1.0,          // pengali biaya desain
    perfBonus: 1.00,
    powerPenalty: 1.15,       // x86 cenderung boros daya
    softwareEcosystem: 0.9,   // banyak software mendukung
    description: 'ISA dominan PC. Ekosistem luas, tapi boros daya.',
  },
  {
    id: 'arm',
    name: 'ARM',
    year: 1995,
    licenseCost: 0,
    difficulty: 0.95,
    perfBonus: 0.92,
    powerPenalty: 0.65,       // hemat daya
    softwareEcosystem: 0.6,
    description: 'Hemat daya, cocok untuk mobile. Ekosistem tumbuh cepat.',
  },
  {
    id: 'powerpc',
    name: 'PowerPC',
    year: 1995,
    licenseCost: 150000,
    difficulty: 1.05,
    perfBonus: 1.05,
    powerPenalty: 1.10,
    softwareEcosystem: 0.55,
    description: 'Arsitektur RISC dengan performa tinggi. Ekosistem terbatas.',
  },
  {
    id: 'mips',
    name: 'MIPS',
    year: 1995,
    licenseCost: 100000,
    difficulty: 0.9,
    perfBonus: 0.95,
    powerPenalty: 0.85,
    softwareEcosystem: 0.5,
    description: 'RISC klasik untuk embedded dan workstation.',
  },
  {
    id: 'riscv',
    name: 'RISC-V',
    year: 2015,               // baru muncul 2015
    licenseCost: 0,           // open source
    difficulty: 0.85,
    perfBonus: 0.98,
    powerPenalty: 0.75,
    softwareEcosystem: 0.4,
    description: 'ISA open-source, bebas lisensi. Ekosistem masih muda.',
  },
];

function getISA(id) {
  return ISA_LIST.find(i => i.id === id) || null;
}

function getAvailableISAs(year) {
  return ISA_LIST.filter(i => i.year <= year);
}
