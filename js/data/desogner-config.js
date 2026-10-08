// js/data/designer-config.js
// Multi-step wizard configs per category.

const DESIGNER_CONFIG = {
  cpu: {
    title: 'CPU Designer',
    icon: 'cpu',
    color: '#c9542a',
    steps: ['Concept', 'Microarchitecture', 'Floorplan'],
    statBar: ['ST', 'MT', 'TDP', 'Cost'],
    namePlaceholder: 'e.g. Core, Pulse, Apex',
    nameSuggestions: ['Core', 'Pulse', 'Dynamo', 'Hexa', 'Prime', 'Vertex'],
  },
  gpu: {
    title: 'GPU Designer',
    icon: 'gpu',
    color: '#7a5ba8',
    steps: ['Concept', 'Shaders', 'Floorplan'],
    statBar: ['Raster', 'BW', 'TDP', 'Cost'],
    namePlaceholder: 'e.g. Radeon, VisionX, Apex',
    nameSuggestions: ['Radeon', 'VisionX', 'NovaBurst', 'StormX', 'Helix', 'Chroma'],
  },
  laptop: {
    title: 'Laptop Designer',
    icon: 'laptop',
    color: '#b8852b',
    steps: ['Concept', 'Platform', 'Product', 'Prototype', 'Release'],
    statBar: [],
    namePlaceholder: 'e.g. SwiftBook Pro 14',
    nameSuggestions: ['SwiftBook', 'AeroPro', 'NovaPad', 'UltraX', 'Zenith', 'FalconBook', 'Nimbus', 'PeakBook'],
  },
  os: {
    title: 'OS Designer',
    icon: 'os',
    color: '#3d8b5f',
    steps: ['Kernel', 'Features', 'Release'],
    statBar: ['Perf', 'Compat', 'Size', 'Cost'],
    namePlaceholder: 'e.g. Nova OS, Helix',
    nameSuggestions: ['Nova OS', 'Helix', 'VertexOS', 'Orbit', 'Lumina', 'Prism'],
  },
  smartphone: {
    title: 'Phone Designer',
    icon: 'phone',
    color: '#c47a2e',
    steps: ['Concept', 'Platform', 'Product', 'Prototype', 'Release'],
    statBar: [],
    namePlaceholder: 'e.g. Nexus X, Orbit One',
    nameSuggestions: ['Nexus', 'Orbit', 'Lumina', 'Prism', 'Zenith', 'Pulse Phone'],
  },
};

// ===== CPU configuration =====
const CPU_CONFIG = {
  isas: [
    { id: 'x86', name: 'x86',     desc: 'Dominant PC standard. Large ecosystem, higher power.' },
    { id: 'arm', name: 'ARM',     desc: 'Power-efficient. Strong in mobile.' },
    { id: 'riscv', name: 'RISC-V', desc: 'Open source. Modern designs.', minYear: 2015 },
  ],
  segments: [
    { id: 'budget_pc',  name: 'Budget PC',    desc: 'Low-cost home and office.' },
    { id: 'enthusiast', name: 'Enthusiast',   desc: 'Gamers and power users.' },
    { id: 'server',     name: 'Server',       desc: 'Data center workloads.', minYear: 1997 },
    { id: 'mobile',     name: 'Mobile',       desc: 'Low-power devices.', minYear: 2007 },
    { id: 'ai_datacenter', name: 'AI / Data Center', desc: 'AI training and inference.', minYear: 2017 },
  ],
};

// ===== GPU configuration =====
const GPU_CONFIG = {
  segments: [
    { id: 'budget_pc',  name: 'Integrated',   desc: 'Embedded in systems.' },
    { id: 'enthusiast', name: 'Gaming',       desc: 'High-end consumer graphics.' },
    { id: 'server',     name: 'Workstation',  desc: 'Professional 3D and compute.', minYear: 1999 },
    { id: 'ai_datacenter', name: 'AI Compute', desc: 'Tensor / AI accelerators.', minYear: 2017 },
  ],
  memoryTypes: [
    { id: 'sdram', name: 'SDRAM',  minYear: 1995, bwMult: 0.8, costMult: 0.8 },
    { id: 'ddr',   name: 'DDR',    minYear: 2000, bwMult: 1.0, costMult: 1.0 },
    { id: 'gddr3', name: 'GDDR3',  minYear: 2004, bwMult: 1.6, costMult: 1.3 },
    { id: 'gddr5', name: 'GDDR5',  minYear: 2008, bwMult: 2.5, costMult: 1.6 },
    { id: 'hbm2',  name: 'HBM2',   minYear: 2016, bwMult: 5.0, costMult: 3.0 },
    { id: 'hbm3',  name: 'HBM3',   minYear: 2022, bwMult: 8.0, costMult: 4.5 },
  ],
};

// ===== Laptop configuration =====
const LAPTOP_CONFIG = {
  chassis: [
    { id: 'budget',    name: 'Budget Plastic',  icon: 'chassis-budget',  cost: 0,   weight: 0.8, durability: 0.6 },
    { id: 'mainstream',name: 'Mainstream Alloy',icon: 'chassis-main',    cost: 30,  weight: 0.5, durability: 0.8 },
    { id: 'premium',   name: 'Premium Unibody', icon: 'chassis-premium', cost: 120, weight: 0.3, durability: 1.0 },
  ],
  segments: [
    { id: 'budget_pc',  name: 'Budget',         minYear: 1995 },
    { id: 'enthusiast', name: 'Consumer',       minYear: 1995 },
    { id: 'server',     name: 'Business / Office', minYear: 1998 },
    { id: 'mobile',     name: 'Ultrabook',      minYear: 2004 },
  ],
};
