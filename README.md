# Trading Bot Frontend (Minimal)

A minimal React + TypeScript frontend for a trading bot dashboard built with Vite. It includes a live chart and a DeFi portfolio view.

### Quick installation
Clone, install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Available scripts:
```bash
# start dev server (HMR)
npm run dev

# build production assets
npm run build

# preview built production bundle
npm run preview

# run linter
npm run lint
```

### Environment
This app expects a couple of environment variables (used in src code):

- VITE_BOT_BASE_URL — base URL for REST API (e.g. wallet, kline, token endpoints)
- VITE_SINTRAL_WS_URL — WebSocket URL for live token kline updates

Create a .env.local (or .env) in the project root with the minimal values:

```env
VITE_BOT_BASE_URL=https://api.example.com
VITE_SINTRAL_WS_URL=wss://ws.example.com
```

### Basic usage
After the dev server starts, open the app in your browser:

http://localhost:5173/

Main routes:
- / — Live chart page (live price chart)
- /defi — DeFi portfolio / token details view

Build for production and preview locally:

```bash
npm run build
npm run preview
```

### Features (minimal)
- Live chart powered by lightweight-charts
- DeFi portfolio view with token details and transaction lists
- Real-time updates via WebSocket
- Theme handling, currency conversion, and toast notifications included

### Troubleshooting
- If data looks missing, confirm VITE_BOT_BASE_URL and VITE_SINTRAL_WS_URL are correct and reachable.
- If the dev server port differs, check the terminal output from `npm run dev` for the actual URL.

### License
MIT