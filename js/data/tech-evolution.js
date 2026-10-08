// js/data/tech-evolution.js
// Real-world tech evolution per category, 1995–2025.
// Designer uses this to lock/unlock options by year.

// =========================================================
// CPU — cores, cache, SIMD, features by year
// =========================================================
const CPU_EVOLUTION = [
  { year: 1995, maxCores: 1,  cacheL1: 16,  cacheL2: 256,   cacheL3: 0,      simd: [],          igpu: false, isa: ['x86'] },
  { year: 1997, maxCores: 1,  cacheL1: 32,  cacheL2: 512,   cacheL3: 0,      simd: ['mmx'],      igpu: false, isa: ['x86'] },
  { year: 1999, maxCores: 1,  cacheL1: 32,  cacheL2: 512,   cacheL3: 0,      simd: ['mmx','sse'],igpu: false, isa: ['x86'] },
  { year: 2001, maxCores: 1,  cacheL1: 64,  cacheL2: 512,   cacheL3: 0,      simd: ['mmx','sse','sse2'], igpu: false, isa: ['x86'] },
  { year: 2003, maxCores: 2,  cacheL1: 64,  cacheL2: 1024,  cacheL3: 0,      simd: ['mmx','sse','sse2'], igpu: true,  isa: ['x86'] },
  { year: 2005, maxCores: 2,  cacheL1: 64,  cacheL2: 2048,  cacheL3: 0,      simd: ['mmx','sse','sse2','sse3'], igpu: true, isa: ['x86'] },
  { year: 2006, maxCores: 4,  cacheL1: 64,  cacheL2: 4096,  cacheL3: 0,      simd: ['mmx','sse','sse2','sse3','ssse3'], igpu: true, isa: ['x86'] },
  { year: 2008, maxCores: 4,  cacheL1: 64,  cacheL2: 6144,  cacheL3: 6144,   simd: ['mmx','sse','sse2','sse3','ssse3','sse4'], igpu: true, isa: ['x86','arm'] },
  { year: 2010, maxCores: 6,  cacheL1: 64,  cacheL2: 8192,  cacheL3: 12288,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4'], igpu: true, isa: ['x86','arm'] },
  { year: 2012, maxCores: 8,  cacheL1: 64,  cacheL2: 8192,  cacheL3: 20480,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2014, maxCores: 12, cacheL1: 64,  cacheL2: 12288, cacheL3: 30720,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2016, maxCores: 16, cacheL1: 64,  cacheL2: 16384, cacheL3: 40960,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2018, maxCores: 24, cacheL1: 64,  cacheL2: 20480, cacheL3: 61440,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2','avx512'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2020, maxCores: 32, cacheL1: 80,  cacheL2: 24576, cacheL3: 81920,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2','avx512'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2022, maxCores: 48, cacheL1: 80,  cacheL2: 32768, cacheL3: 98304,  simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2','avx512'], igpu: true, isa: ['x86','arm','riscv'] },
  { year: 2025, maxCores: 64, cacheL1: 96,  cacheL2: 49152, cacheL3: 131072, simd: ['mmx','sse','sse2','sse3','ssse3','sse4','avx','avx2','avx512'], igpu: true, isa: ['x86','arm','riscv'] },
];

function getCpuEvolution(year) {
  let best = CPU_EVOLUTION[0];
  for (const e of CPU_EVOLUTION) if (year >= e.year) best = e;
  return best;
}

// =========================================================
// GPU — shader models, memory tech, features by year
// =========================================================
const GPU_EVOLUTION = [
  { year: 1995, maxShaders: 4,  maxRops: 2,  memory: ['sdram'],                  features: ['2d'] },
  { year: 1997, maxShaders: 8,  maxRops: 4,  memory: ['sdram','sgram'],           features: ['2d','3d'] },
  { year: 1999, maxShaders: 12, maxRops: 4,  memory: ['sgram','ddr'],             features: ['2d','3d','t&l'] },
  { year: 2001, maxShaders: 16, maxRops: 8,  memory: ['ddr','ddr2'],              features: ['2d','3d','t&l','shader1'] },
  { year: 2004, maxShaders: 24, maxRops: 12, memory: ['ddr2','gddr3'],            features: ['2d','3d','t&l','shader2','pcie'] },
  { year: 2006, maxShaders: 32, maxRops: 16, memory: ['gddr3','gddr4'],           features: ['3d','shader3','pcie','cuda'] },
  { year: 2008, maxShaders: 40, maxRops: 24, memory: ['gddr4','gddr5'],           features: ['3d','shader4','pcie','cuda','opencl'] },
  { year: 2010, maxShaders: 48, maxRops: 32, memory: ['gddr5'],                   features: ['3d','shader4','pcie','cuda','opencl','tessellation'] },
  { year: 2012, maxShaders: 56, maxRops: 32, memory: ['gddr5'],                   features: ['3d','shader5','pcie3','cuda','opencl','tessellation'] },
  { year: 2014, maxShaders: 64, maxRops: 40, memory: ['gddr5'],                   features: ['3d','shader5','pcie3','compute','raytracing-sw'] },
  { year: 2016, maxShaders: 64, maxRops: 48, memory: ['gddr5','hbm2'],            features: ['3d','shader5','pcie3','compute','hbm','tensor'] },
  { year: 2018, maxShaders: 80, maxRops: 64, memory: ['gddr6','hbm2'],            features: ['3d','shader6','pcie4','compute','raytracing','tensor'] },
  { year: 2020, maxShaders: 96, maxRops: 96, memory: ['gddr6','hbm2e'],           features: ['3d','shader6','pcie4','compute','raytracing','tensor','mesh'] },
  { year: 2022, maxShaders: 128,maxRops: 128,memory: ['gddr6x','hbm3'],           features: ['3d','shader6','pcie5','compute','raytracing','tensor','mesh','chiplet'] },
  { year: 2025, maxShaders: 192,maxRops: 192,memory: ['gddr7','hbm3e'],           features: ['3d','shader6','pcie5','compute','raytracing','tensor','mesh','chiplet'] },
];

function getGpuEvolution(year) {
  let best = GPU_EVOLUTION[0];
  for (const e of GPU_EVOLUTION) if (year >= e.year) best = e;
  return best;
}

// =========================================================
// LAPTOP — chassis, screens, ports, features by year
// =========================================================
const LAPTOP_EVOLUTION = [
  { year: 1995, screens: [10, 12, 13],        features: ['floppy','cd'],                   wireless: false },
  { year: 1997, screens: [12, 13, 14],        features: ['cd','dvd','usb1'],               wireless: false },
  { year: 1999, screens: [13, 14, 15],        features: ['dvd','usb1','wifi'],             wireless: true },
  { year: 2001, screens: [12, 13, 14, 15],    features: ['dvd','usb2','wifi'],             wireless: true },
  { year: 2003, screens: [12, 13, 14, 15, 17],features: ['dvd','usb2','wifi','bt'],        wireless: true },
  { year: 2005, screens: [12, 13, 14, 15, 17],features: ['dvdrw','usb2','wifi','bt'],      wireless: true },
  { year: 2007, screens: [11, 12, 13, 14, 15],features: ['dvdrw','usb2','wifi','bt','hdmi'],wireless: true },
  { year: 2009, screens: [11, 12, 13, 14, 15],features: ['dvdrw','usb2','wifi','bt','hdmi','ssd'], wireless: true },
  { year: 2011, screens: [11, 12, 13, 14, 15],features: ['usb3','wifi','bt','hdmi','ssd','tb'], wireless: true },
  { year: 2013, screens: [11, 12, 13, 14, 15],features: ['usb3','wifi','bt','hdmi','ssd','tb','touch'], wireless: true },
  { year: 2015, screens: [12, 13, 14, 15],    features: ['usb3','usbc','wifi','bt','hdmi','ssd','tb'], wireless: true },
  { year: 2017, screens: [12, 13, 14, 15],    features: ['usbc','wifi5','bt','ssd','tb3','fhd'], wireless: true },
  { year: 2019, screens: [13, 14, 15, 16],    features: ['usbc','wifi5','bt','ssd','tb3','4k','fhd'], wireless: true },
  { year: 2021, screens: [13, 14, 15, 16],    features: ['usbc','wifi6','bt5','ssd','tb4','4k','mini-led'], wireless: true },
  { year: 2023, screens: [13, 14, 15, 16],    features: ['usbc','wifi6e','bt5','ssd','tb4','4k','oled'], wireless: true },
  { year: 2025, screens: [13, 14, 15, 16],    features: ['usbc','wifi7','bt5','ssd','tb5','4k','oled'], wireless: true },
];

function getLaptopEvolution(year) {
  let best = LAPTOP_EVOLUTION[0];
  for (const e of LAPTOP_EVOLUTION) if (year >= e.year) best = e;
  return best;
}

// =========================================================
// OS — kernel paradigms, features by year
// =========================================================
const OS_EVOLUTION = [
  { year: 1995, kernels: ['unix','dos','nt'],                    userSpace: ['gui','network','multitask'],                 signatureFeature: 'Start menu' },
  { year: 1997, kernels: ['unix','nt','hybrid'],                 userSpace: ['gui','network','multitask','multiuser'],     signatureFeature: 'USB support' },
  { year: 1999, kernels: ['unix','nt','hybrid','micro'],         userSpace: ['gui','network','multitask','multiuser','browser'], signatureFeature: 'Internet integration' },
  { year: 2001, kernels: ['unix','nt','hybrid','micro'],         userSpace: ['gui','network','multitask','multiuser','browser','stability'], signatureFeature: 'NT kernel' },
  { year: 2003, kernels: ['unix','nt','hybrid','micro','rt'],    userSpace: ['gui','network','multitask','multiuser','browser','security'], signatureFeature: 'Security hardening' },
  { year: 2005, kernels: ['unix','nt','hybrid','micro','rt','xnu'], userSpace: ['gui','network','multitask','multiuser','browser','mobile'], signatureFeature: 'Mobile shell' },
  { year: 2007, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch'], signatureFeature: 'Touch input' },
  { year: 2009, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore'], signatureFeature: 'App stores' },
  { year: 2011, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice'], signatureFeature: 'Voice assistants' },
  { year: 2013, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud'], signatureFeature: 'Cloud sync' },
  { year: 2015, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity'], signatureFeature: 'Continuity across devices' },
  { year: 2017, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity','darkmode'], signatureFeature: 'Dark mode' },
  { year: 2019, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity','darkmode','arm64'], signatureFeature: 'ARM64 support' },
  { year: 2021, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity','darkmode','arm64','widgets'], signatureFeature: 'Widgets & focus modes' },
  { year: 2023, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity','darkmode','arm64','widgets','ai'], signatureFeature: 'AI assistants' },
  { year: 2025, kernels: ['unix','nt','hybrid','micro','xnu','linux'], userSpace: ['gui','network','multitask','multiuser','browser','mobile','touch','appstore','voice','cloud','continuity','darkmode','arm64','widgets','ai','localai'], signatureFeature: 'On-device AI' },
];

function getOsEvolution(year) {
  let best = OS_EVOLUTION[0];
  for (const e of OS_EVOLUTION) if (year >= e.year) best = e;
  return best;
}

// =========================================================
// SMARTPHONE — bodies, screens, cameras, features by year
// =========================================================
const PHONE_EVOLUTION = [
  { year: 2007, screens: [3.5, 4.0],           cameras: ['basic'],        features: ['touch','wifi','3g'],                    body: ['plastic'] },
  { year: 2008, screens: [3.5, 4.0, 4.3],      cameras: ['basic','mid'],  features: ['touch','wifi','3g','gps','appstore'],   body: ['plastic'] },
  { year: 2009, screens: [3.5, 4.0, 4.3],      cameras: ['basic','mid'],  features: ['touch','wifi','3g','gps','appstore'],   body: ['plastic','glass'] },
  { year: 2010, screens: [3.5, 4.0, 4.3, 4.7], cameras: ['mid'],          features: ['touch','wifi','4g','gps','appstore','front-cam'], body: ['plastic','glass'] },
  { year: 2011, screens: [4.0, 4.3, 4.7, 5.0], cameras: ['mid'],          features: ['touch','wifi','4g','gps','appstore','front-cam','voice'], body: ['plastic','glass'] },
  { year: 2012, screens: [4.0, 4.7, 5.0, 5.5], cameras: ['mid','high'],   features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte'], body: ['plastic','glass','ceramic'] },
  { year: 2013, screens: [4.7, 5.0, 5.5, 6.0], cameras: ['mid','high'],   features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','fingerprint'], body: ['glass','ceramic'] },
  { year: 2014, screens: [4.7, 5.0, 5.5, 6.0], cameras: ['mid','high','dual'], features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','fingerprint'], body: ['glass','ceramic'] },
  { year: 2015, screens: [4.7, 5.0, 5.5, 6.0], cameras: ['high','dual'],  features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','fingerprint','usb-c'], body: ['glass','ceramic'] },
  { year: 2016, screens: [5.0, 5.5, 5.7, 6.0], cameras: ['high','dual'],  features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','fingerprint','usb-c','dual-cam'], body: ['glass','ceramic'] },
  { year: 2017, screens: [5.5, 5.8, 6.0, 6.3], cameras: ['high','dual'],  features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','facial','usb-c','dual-cam'], body: ['glass','ceramic'] },
  { year: 2018, screens: [5.8, 6.0, 6.3, 6.5], cameras: ['high','dual'],  features: ['touch','wifi','4g','gps','appstore','front-cam','voice','lte','facial','usb-c','dual-cam','wireless-chg'], body: ['glass','ceramic'] },
  { year: 2019, screens: [6.0, 6.3, 6.5, 6.7], cameras: ['dual'],          features: ['touch','wifi','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','dual-cam','wireless-chg'], body: ['glass','ceramic'] },
  { year: 2020, screens: [6.0, 6.3, 6.5, 6.7], cameras: ['dual','triple'], features: ['touch','wifi','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz'], body: ['glass','ceramic'] },
  { year: 2021, screens: [6.1, 6.4, 6.7, 6.9], cameras: ['dual','triple'], features: ['touch','wifi','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz','foldable'], body: ['glass','ceramic'] },
  { year: 2022, screens: [6.1, 6.4, 6.7, 7.6], cameras: ['triple'],        features: ['touch','wifi6','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz','foldable','satellite'], body: ['glass','ceramic'] },
  { year: 2023, screens: [6.1, 6.4, 6.7, 7.6], cameras: ['triple'],        features: ['touch','wifi6e','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz','foldable','satellite','titanium'], body: ['glass','ceramic','titanium'] },
  { year: 2024, screens: [6.1, 6.4, 6.7, 7.6], cameras: ['triple'],        features: ['touch','wifi7','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz','foldable','satellite','titanium','ai'], body: ['glass','ceramic','titanium'] },
  { year: 2025, screens: [6.1, 6.4, 6.7, 7.6], cameras: ['triple'],        features: ['touch','wifi7','5g','gps','appstore','front-cam','voice','lte','facial','usb-c','triple-cam','wireless-chg','120hz','foldable','satellite','titanium','ai','on-device-ai'], body: ['glass','ceramic','titanium'] },
];

function getPhoneEvolution(year) {
  let best = PHONE_EVOLUTION[0];
  for (const e of PHONE_EVOLUTION) if (year >= e.year) best = e;
  return best;
}

// =========================================================
// HELPERS
// =========================================================
function featureAvailable(feature, availableList) {
  return availableList.includes(feature);
}

// Human-readable labels for feature tags
const FEATURE_LABELS = {
  // CPU
  mmx: 'MMX', sse: 'SSE', sse2: 'SSE2', sse3: 'SSE3', ssse3: 'SSSE3', sse4: 'SSE4',
  avx: 'AVX', avx2: 'AVX2', avx512: 'AVX-512',
  // GPU
  '2d': '2D Accelerator', '3d': '3D Pipeline', 't&l': 'Transform & Lighting',
  'shader1': 'Shader Model 1.0', 'shader2': 'Shader Model 2.0', 'shader3': 'Shader Model 3.0',
  'shader4': 'Shader Model 4.0', 'shader5': 'Shader Model 5.0', 'shader6': 'Shader Model 6.0',
  pcie: 'PCIe', pcie3: 'PCIe 3.0', pcie4: 'PCIe 4.0', pcie5: 'PCIe 5.0',
  cuda: 'CUDA', opencl: 'OpenCL', compute: 'Compute Shaders',
  'raytracing': 'Hardware Ray Tracing', 'raytracing-sw': 'Software Ray Tracing',
  tensor: 'Tensor Cores', mesh: 'Mesh Shaders', chiplet: 'Chiplet Design',
  hbm: 'HBM Memory',
  // Laptop
  floppy: 'Floppy Drive', cd: 'CD-ROM', dvd: 'DVD', dvdrw: 'DVD-RW',
  usb1: 'USB 1.1', usb2: 'USB 2.0', usb3: 'USB 3.0', usbc: 'USB-C',
  wifi: 'Wi-Fi', wifi5: 'Wi-Fi 5', wifi6: 'Wi-Fi 6', wifi6e: 'Wi-Fi 6E', wifi7: 'Wi-Fi 7',
  bt: 'Bluetooth', bt5: 'Bluetooth 5',
  hdmi: 'HDMI', ssd: 'SSD', tb: 'Thunderbolt', tb3: 'Thunderbolt 3', tb4: 'Thunderbolt 4', tb5: 'Thunderbolt 5',
  touch: 'Touchscreen', fhd: 'FHD Display', '4k': '4K Display',
  'mini-led': 'Mini-LED', oled: 'OLED', '2k': '2K Display',
  // OS
  gui: 'Graphical UI', network: 'Networking', multitask: 'Multitasking',
  multiuser: 'Multi-user', browser: 'Web Browser', stability: 'Stability',
  security: 'Security', mobile: 'Mobile Shell', appstore: 'App Store',
  voice: 'Voice Assistant', cloud: 'Cloud Sync', continuity: 'Cross-device',
  darkmode: 'Dark Mode', arm64: 'ARM64 Support', widgets: 'Widgets',
  ai: 'AI Assistant', localai: 'On-device AI',
  // Phone
  '3g': '3G', '4g': '4G LTE', '5g': '5G', gps: 'GPS',
  'front-cam': 'Front Camera', lte: 'LTE', fingerprint: 'Fingerprint',
  facial: 'Face ID', 'dual-cam': 'Dual Camera', 'triple-cam': 'Triple Camera',
  'wireless-chg': 'Wireless Charging', '120hz': '120Hz Display',
  foldable: 'Foldable Display', satellite: 'Satellite SOS', titanium: 'Titanium Frame',
};

function labelForFeature(id) {
  return FEATURE_LABELS[id] || id.toUpperCase().replace(/-/g, ' ');
                          }
