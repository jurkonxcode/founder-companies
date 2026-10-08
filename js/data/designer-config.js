// js/data/designer-config.js
// Config for all 5 product designers.

const DESIGNER_CONFIG = {
  cpu: {
    title: 'CPU Designer',
    color: '#c9542a',
    steps: ['Concept', 'Microarchitecture', 'Floorplan'],
    statBar: ['ST', 'MT', 'TDP', 'Cost'],
    namePlaceholder: 'e.g. Core, Pulse, Apex',
    nameSuggestions: ['Core', 'Pulse', 'Dynamo', 'Hexa', 'Prime', 'Vertex', 'Zenith'],
    hint: 'A CPU for general-purpose computing.',
  },
  gpu: {
    title: 'GPU Designer',
    color: '#7a5ba8',
    steps: ['Concept', 'Shaders', 'Memory', 'Floorplan'],
    statBar: ['Raster', 'BW', 'TDP', 'Cost'],
    namePlaceholder: 'e.g. Radeon, VisionX',
    nameSuggestions: ['Radeon', 'VisionX', 'NovaBurst', 'StormX', 'Helix', 'Chroma', 'Pulsar'],
    hint: 'A graphics processor for rendering and compute.',
  },
  laptop: {
    title: 'Laptop Designer',
    color: '#b8852b',
    steps: ['Concept', 'Platform', 'Chassis', 'Release'],
    statBar: ['Perf', 'Weight', 'Battery', 'Cost'],
    namePlaceholder: 'e.g. SwiftBook Pro 14',
    nameSuggestions: ['SwiftBook', 'AeroPro', 'NovaPad', 'UltraX', 'Zenith', 'FalconBook', 'Nimbus'],
    hint: 'A portable computer built from your own silicon.',
  },
  os: {
    title: 'OS Designer',
    color: '#3d8b5f',
    steps: ['Kernel', 'Features', 'Release'],
    statBar: ['Perf', 'Compat', 'Size', 'Cost'],
    namePlaceholder: 'e.g. Nova OS, Helix',
    nameSuggestions: ['Nova OS', 'Helix', 'VertexOS', 'Orbit', 'Lumina', 'Prism', 'Quantum'],
    hint: 'An operating system that ships with your hardware.',
  },
  smartphone: {
    title: 'Phone Designer',
    color: '#c47a2e',
    steps: ['Concept', 'Platform', 'Body', 'Release'],
    statBar: ['Perf', 'Battery', 'Weight', 'Cost'],
    namePlaceholder: 'e.g. Nexus X, Orbit One',
    nameSuggestions: ['Nexus', 'Orbit', 'Lumina', 'Prism', 'Zenith', 'Pulse', 'Apex Phone'],
    hint: 'A pocket computer with your chip inside.',
  },
};

// ===== CPU config =====
const CPU_CONFIG = {
  isas: [
    { id: 'x86',   name: 'x86',    desc: 'Dominant PC standard. Wide ecosystem, higher power.' },
    { id: 'arm',   name: 'ARM',    desc: 'Power-efficient RISC. Strong in mobile.' },
    { id: 'riscv', name: 'RISC-V', desc: 'Open-source. Modern design freedom.', minYear: 2015 },
  ],
  segments: [
    { id: 'budget_pc',    name: 'Budget PC',    desc: 'Low-cost home & office.' },
    { id: 'enthusiast',   name: 'Enthusiast',   desc: 'Gamers & power users.' },
    { id: 'server',       name: 'Server',       desc: 'Data center workloads.', minYear: 1997 },
    { id: 'mobile',       name: 'Mobile',       desc: 'Low-power devices.', minYear: 2007 },
    { id: 'ai_datacenter',name: 'AI Compute',   desc: 'AI training & inference.', minYear: 2017 },
  ],
};

// ===== GPU config =====
const GPU_CONFIG = {
  segments: [
    { id: 'budget_pc',    name: 'Integrated',  desc: 'Embedded in systems.' },
    { id: 'enthusiast',   name: 'Gaming',      desc: 'High-end consumer graphics.' },
    { id: 'server',       name: 'Workstation', desc: 'Professional 3D.', minYear: 1999 },
    { id: 'ai_datacenter',name: 'AI Compute',  desc: 'Tensor / AI accelerators.', minYear: 2017 },
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

// ===== Laptop config =====
const LAPTOP_CONFIG = {
  chassis: [
    { id: 'budget',    name: 'Budget Plastic',   cost: 0,   weight: 2.6, durability: 0.6, desc: 'Cheap but bulky.' },
    { id: 'mainstream',name: 'Aluminium Alloy',  cost: 30,  weight: 2.0, durability: 0.8, desc: 'Balanced build.' },
    { id: 'premium',   name: 'Premium Unibody',  cost: 120, weight: 1.4, durability: 1.0, desc: 'Thin, light, solid.' },
  ],
  segments: [
    { id: 'budget_pc',   name: 'Budget',       minYear: 1995 },
    { id: 'enthusiast',  name: 'Consumer',     minYear: 1995 },
    { id: 'server',      name: 'Business',     minYear: 1998 },
    { id: 'mobile',      name: 'Ultrabook',    minYear: 2004 },
  ],
};

// ===== OS config =====
const OS_CONFIG = {
  kernels: [
    { id: 'unix',   name: 'Unix-based',   desc: 'Mature, portable. Larger footprint.', costMult: 0.9, perfBonus: 1.0 },
    { id: 'nt',     name: 'Hybrid kernel',desc: 'Broad hardware support, complex.',    costMult: 1.1, perfBonus: 1.05 },
    { id: 'micro',  name: 'Microkernel',  desc: 'Small, secure, harder to optimize.',  costMult: 1.2, perfBonus: 0.95 },
    { id: 'rt',     name: 'Real-time',    desc: 'Deterministic for embedded systems.', costMult: 1.0, perfBonus: 0.9 },
  ],
  featurePacks: [
    { id: 'gui',      name: 'Graphical UI',    cost: 200,  year: 1995 },
    { id: 'network',  name: 'Networking',      cost: 150,  year: 1995 },
    { id: 'multitask',name: 'Multitasking',    cost: 250,  year: 1996 },
    { id: 'multiuser',name: 'Multi-user',      cost: 300,  year: 1997 },
    { id: 'browser',  name: 'Web Browser',     cost: 400,  year: 1998 },
    { id: 'mobile',   name: 'Mobile Shell',    cost: 500,  year: 2005 },
    { id: 'touch',    name: 'Touch Input',     cost: 600,  year: 2007 },
    { id: 'cloud',    name: 'Cloud Sync',      cost: 800,  year: 2010 },
    { id: 'ai',       name: 'AI Assistant',    cost: 1500, year: 2016 },
    { id: 'arm64',    name: 'ARM64 Support',   cost: 700,  year: 2012 },
  ],
  segments: [
    { id: 'budget_pc', name: 'Desktop',    minYear: 1995 },
    { id: 'server',    name: 'Server',     minYear: 1997 },
    { id: 'mobile',    name: 'Mobile',     minYear: 2007 },
  ],
};

// ===== Smartphone config =====
const PHONE_CONFIG = {
  bodies: [
    { id: 'plastic', name: 'Plastic Body',    cost: 0,  weight: 180, desc: 'Cheap, scratches easily.' },
    { id: 'glass',   name: 'Glass & Metal',   cost: 40, weight: 165, desc: 'Premium feel.' },
    { id: 'ceramic', name: 'Ceramic Frame',   cost: 90, weight: 175, desc: 'Durable, premium.' },
  ],
  segments: [
    { id: 'budget_pc', name: 'Budget',   minYear: 2007 },
    { id: 'mobile',    name: 'Flagship', minYear: 2008 },
    { id: 'enthusiast',name: 'Pro',      minYear: 2012 },
  ],
  cameraTiers: [
    { id: 'basic',    name: 'Basic 2MP',      cost: 5,   year: 2007 },
    { id: 'mid',      name: '5MP',            cost: 15,  year: 2010 },
    { id: 'high',     name: '12MP',           cost: 40,  year: 2014 },
    { id: 'dual',     name: 'Dual 12MP',      cost: 80,  year: 2017 },
    { id: 'triple',   name: 'Triple + OIS',   cost: 150, year: 2020 },
  ],
};
