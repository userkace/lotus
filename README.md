# Lotus

Real-time Warframe World State Tracker — an up-to-date, responsive React app that fetches and displays Warframe worldstate data with live refresh and rich client-side processing.

**Highlights**
- Real-time worldstate from Tenno Tools API with automatic updates and manual refresh.
- Comprehensive processing for Sorties, Fissures (including Steel Path), Nightwave, Invasions, Alerts, Events, Void Trader, Void Storms, Arbitrations, Acolytes, Bounties, Faction Projects, Daily Deals, World Cycles, and more.
- Modern UI built with TailwindCSS, Framer Motion animations, and Lucide icons.

**Quick Links**
- Project: [README.md](README.md)
- App entry: [src/App.jsx](src/App.jsx#L1)
- API helpers: [src/api/warframeService.js](src/api/warframeService.js#L1)

## Features

- **World Cycles** — Day/night cycles for locations are parsed and shown.
- **Sorties** — boss, mission types, modifiers and mission list.
- **Void Fissures** — active fissures with tier, type, node, planet, and filtering (regular + Steel Path).
- **Nightwave** — active acts, daily/weekly challenges, and progress.
- **Invasions** — attacker/defender rewards and progress tracking.
- **Alerts** — timed alerts with rewards and time remaining.
- **Void Trader (Baro Ki'Teer)** — inventory and countdown until arrival.
- **Daily Deals** — in-game market specials and discounts.
- **Arbitrations** — high-tier endless mission variants.
- **Void Storms** — Railjack void-storms and locations.
- **Acolytes & Bounties** — death squads and syndicate bounties listing.
- **Faction Projects** — community goals and reward tracking.
- **Kuva Siphons / Special Nodes** — mission tracking for special events.
- **Events & News** — in-game news items and event listing.

## Tech Stack

- **React 18** (hooks) — app UI
- **Vite** — dev server and build
- **TailwindCSS** — styling and theme variables
- **Framer Motion** — subtle UI animations
- **Lucide React** — icons

## Getting Started

Prerequisites:

- Node.js 16+ and npm (or yarn).

Install and run:

```bash
git clone https://github.com/your-username/lotus.git
cd lotus
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Configuration & Usage

- Default platform and refresh behavior are set in `src/App.jsx`; change the platform string passed to the fetch helper to switch platforms (supported: `pc`, `ps4`, `xb1`, `ns`). See [src/App.jsx](src/App.jsx#L150-L200).
- Auto-refresh interval: by default the app refreshes every 5 minutes — adjust the interval in `src/App.jsx`.
- Use the manual refresh button in the UI for on-demand updates.

### Environment & API

The app fetches data from the Tenno Tools worldstate endpoint:

```
https://api.tenno.tools/worldstate/{platform}
```

No API key is required for the public endpoints used by this project.

## Project Structure

```
src/
├── api/
│   └── warframeService.js    # fetch + data helpers (parsing timestamps, nodes, filters)
├── App.jsx                    # main UI + data wiring
├── main.jsx                   # React entry
├── index.css                  # theme variables + Tailwind
└── assets/                    # icons, images
```

## Data Processing Notes

- Parsing & formatting occurs client-side in `src/api/warframeService.js` and `src/App.jsx` — timestamps are converted, node IDs mapped to readable locations, and grouped data structures are created for easy rendering.
- Filtering: fissures, Steel Path, and Void Storms support client-side filters; Nightwave and challenges are sorted into daily/weekly groups.

## Development Tips

- Run the dev server with `npm run dev` — Vite provides hot reloads.
- Build for production with `npm run build`.
- Formatting & linting settings are in the repo; run your preferred tools to match the project's style.

## Contributing

1. Fork the repo and create a descriptive branch.
2. Run the dev server and make changes locally.
3. Add tests where appropriate and update documentation.
4. Open a pull request describing the change and rationale.

## Acknowledgments

- Tenno Tools API — worldstate provider
- Digital Extremes — Warframe

**Built with ❤️ for the Warframe community**
