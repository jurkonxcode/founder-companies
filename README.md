# Founder Companies

A small frontend dashboard project for founder-company simulation and analysis.

## Structure

- `index.html`
- `style.css`
- `js/`
  - `data/`
  - `systems/`
  - `ui/`
  - `state.js`
  - `main.js`

## Notes

This project is intentionally scaffolded and ready for UI and data expansion.

# Founder Companies

**A turn-based semiconductor tycoon — from 1995 to 2nm.**

Build a technology empire from a $5,000 garage startup. Design CPUs, GPUs, laptops, operating systems, and smartphones. Recruit engineers. Research process nodes as they appear in real history. Outmaneuver eight rival AI companies through three decades of industry disruption.

Inspired by *Silicon Empire: Chip Tycoon* — built from scratch with vanilla HTML, CSS, and JavaScript. No frameworks. No build tools. No dependencies.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [How to Play](#how-to-play)
- [Game Systems](#game-systems)
- [Controls](#controls)
- [Project Structure](#project-structure)
- [Technical Notes](#technical-notes)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [License](#license)

---

## Features

### 🎮 Core Gameplay

- **Turn-based simulation** — 1 turn = 1 month, starting January 1995
- **Auto-advance timer** — pause, 1×, 2×, or 4× speed
- **5 product categories** — CPU, GPU, Laptop, OS, Smartphone
- **Detailed designer wizards** — configure ISA, cores, clock, cache, shaders, memory, chassis, kernel, camera tiers, and more
- **Live die floorplan** — visual silicon layout that changes as you adjust specs
- **Real-time projections** — ST/MT performance, TDP, cost update as you design

### 🔬 Tech Tree (1995–2025)

- 15 real process nodes, from **350nm (1995)** to **2nm (2025)**
- Each node has authentic characteristics: transistor density, yield rate, wafer cost, TDP factor, and max clock
- Node research unlocks only in the year it was actually available — you can't skip the Moore's Law curve

### 👥 Engineering Team

- **5 engineer levels** — Junior, Mid, Senior, Principal, Legendary
- **7 specializations** — Microarchitecture, Cache, Clock, Thermal, Verification, I/O, Process
- Hire, train, and manage loyalty
- Engineers accelerate R&D, improve yield, and boost RP gain
- Specialists resign if loyalty drops too low

### 🌍 Market Simulation

- **8 rival AI companies** — each with unique personality, focus, and aggression
- **5 market segments** — Budget PC, Enthusiast, Server, Mobile, AI/Data Center
- **Dynamic pricing** — demand responds to your price, performance, TDP, and features
- **Historical events** — Dot-com bust (2001), Financial Crisis (2008), Smartphone Boom (2007), AI Era (2017), Pandemic (2020), 2nm Era (2025)
- **Random events** — Engineer poaching, viral products, patent lawsuits, government subsidies

### 💰 Business Systems

- **Operating costs** — salaries, office rent, marketing, R&D burn
- **Loan system** — borrow against projected revenue
- **Bankruptcy** — run out of cash and the game ends
- **Save & load** — auto-save every 30 seconds
- **Export/import** — backup saves as base64 code to clipboard

### 🎨 Modern UI

- **Warm cream theme** — serif headlines, sans body, mono for numbers
- **Duotone navigation** — icons switch from outline to filled when active
- **Bottom nav (mobile)** — 5 tabs with animated pill indicator
- **Device status bar** — real clock and battery on mobile
- **Live KPI dashboard** — sparklines tracking cash, market share, and revenue
- **Milestone tracker** — 10 achievements tracking your company's history
- **Fully responsive** — desktop, tablet, and phone

---

## Quick Start

### Method 1 — Open the file directly

1. Download or clone this repo
2. Double-click `index.html`
3. That's it — no install, no build step

### Method 2 — Local server (for development)

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve .
