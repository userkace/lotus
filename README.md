# Lotus - Real-time Warframe World State Tracker

A modern, responsive React application that tracks real-time Warframe world state data with live updates every 5 minutes.

## Features

### 🎮 Real-time Data Tracking
- **Sorties** - Daily missions with modifiers and rewards
- **Void Fissures** - Active fissures with tier filtering
- **Nightwave** - Daily and weekly acts with progress tracking
- **Invasions** - Faction conflicts with progress bars
- **Alerts** - Time-limited missions with rewards
- **Archon Hunt** - Weekly boss missions
- **Daily Deals** - Market specials with discounts
- **Void Trader (Baro Ki'Teer)** - Inventory and timing
- **World Cycles** - Day/night cycles for all locations
- **Arbitrations** - Endless mission variants
- **Void Storms** - Railjack void fissures
- **Acolytes** - Death squad tracking
- **Bounties** - Syndicate mission boards
- **Faction Projects** - Community goals
- **Kuva Siphons** - Kuva extraction missions

### 🎨 Modern UI/UX
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Theme** - Warframe-inspired color scheme
- **Loading States** - Smooth animations and placeholders
- **Error Handling** - Graceful fallbacks and retry options
- **Auto-refresh** - Updates every 5 minutes
- **Manual Refresh** - On-demand data updates

### 🚀 Technical Features
- **Direct API Integration** - Fetches from Tenno Tools API
- **Platform Support** - PC, PS4, Xbox, Switch (configurable)
- **SEO Optimized** - Meta tags for search engines
- **Performance Optimized** - Efficient data processing and rendering

## Technology Stack

- **Frontend**: React 18 with Hooks
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **API**: Tenno Tools API (direct integration)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lotus.git
cd lotus

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. Open your browser and navigate to `http://localhost:5173`
2. The app will automatically start fetching Warframe data
3. Data refreshes every 5 minutes automatically
4. Use the refresh button for manual updates

## API Integration

The application uses the [Tenno Tools API](https://api.tenno.tools/) for real-time Warframe data:

- **Endpoint**: `https://api.tenno.tools/worldstate/{platform}`
- **Platforms**: `pc`, `ps4`, `xb1`, `ns`
- **Update Frequency**: Every 5 minutes
- **Data Processing**: Client-side parsing and formatting

## Project Structure

```
src/
├── api/
│   └── warframeService.js    # API integration and data processing
├── App.jsx                  # Main application component
├── index.css                # Global styles and TailwindCSS
└── main.jsx                 # Application entry point
```

## Data Processing

The `warframeService.js` handles:
- **API Fetching** - Direct calls to Tenno Tools API
- **Timestamp Parsing** - Unix timestamp conversion
- **Data Formatting** - Human-readable time displays
- **Challenge Sorting** - Daily/weekly Nightwave grouping
- **Location Extraction** - Node name to readable location mapping

## Customization

### Platform Selection
Change the default platform in `App.jsx`:
```javascript
const data = await fetchWarframeData('pc'); // Change to 'ps4', 'xb1', or 'ns'
```

### Refresh Interval
Modify the auto-refresh timer in `App.jsx`:
```javascript
const interval = setInterval(fetchData, 5 * 60 * 1000); // Change 5 to desired minutes
```

### Styling
Customize the Warframe theme in `index.css`:
- Primary colors: `--wf-primary` and `--wf-primary-hover`
- Background: `--wf-bg`
- Text: `--wf-text` and `--wf-text-muted`
- Borders: `--wf-border`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Tenno Tools](https://api.tenno.tools/) - API provider
- [Digital Extremes](https://www.warframe.com/) - Warframe developers
- Warframe community for feedback and suggestions

---

**Built with ❤️ for the Warframe community**
