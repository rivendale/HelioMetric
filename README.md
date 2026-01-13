# HelioMetric
Helio-Metric is an open-source framework that correlates heliospheric data (NOAA Solar Cycle feeds) with local temporal variables (Calendar cycles). It uses node-based graphs to visualize how external high-energy events (Solar Maximums) interact with static internal datasets (User Profiles).

## HelioMetric Instrument Panel

A Next.js 14 scientific dashboard correlating Chinese Zodiac temporal cycles with NOAA Space Weather data (2026 Fire Horse interference analysis).

### Features

- **Real-time NOAA K-Index Integration**: Fetches live geomagnetic activity data from NOAA Space Weather Prediction Center
- **Fire Horse Interference Analysis**: Scientific calculations based on 2026 Fire Horse resonance and damping patterns
- **Family Resonance Grid**: Visualizes interference patterns for family members based on Chinese Zodiac signs
- **Wu Xing Elemental Theory**: Uses Five Elements (Wood, Fire, Earth, Metal, Water) for coupling calculations
- **Dark Mode Instrument Panel UI**: Professional data visualization aesthetic with Tailwind CSS

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the instrument panel.

### Architecture

- **Next.js 14**: App Router with TypeScript and Server Components
- **Node.js Runtime**: Standard fetch API (not Edge runtime)
- **Tailwind CSS**: Utility-first styling with dark mode
- **AGPL-3.0 License**: Open source with copyleft provisions

### Core Modules

- `lib/HelioEngine.ts`: Resonance/damping interference calculations
- `lib/noaa.ts`: NOAA K-Index API integration
- `app/page.tsx`: Main instrument panel UI
