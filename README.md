# Log Scanner — UI

A lightweight, responsive React + Vite user interface for browsing, searching, and analyzing log files quickly.

This repository contains the frontend for the Log Scanner application: a developer-friendly UI to load logs, filter and search entries, tail live streams, and highlight patterns.

**Built with:** React, Vite, CSS

**Live preview:** Runs on Vite's dev server (default port `5173`).

**Key Features**
- Fast client-side searching and filtering of large log files
- Tail mode to follow a live log stream
- Regex and keyword highlighting
- Multi-file load and quick switching between log sources
- Adjustable time/date parsing and timezone support

## Prerequisites
- Node.js (LTS recommended)
- npm (or yarn/pnpm)

## Install & Run (development)
Open a PowerShell terminal and run:

```powershell
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

If your `package.json` uses different script names, use the scripts shown there (for example `npm run start` or `npm run preview`).

## Build (production)

```powershell
npm run build
npm run preview
```

## Usage
- Drag-and-drop or use the file picker to load one or more log files.
- Use the search box to run quick keyword searches; enable regex for advanced patterns.
- Apply filters (level, date range, source) to reduce noise.
- Toggle tail mode to follow new entries as they arrive.
- Click an entry to expand details or copy the line for sharing.

## Configuration
- The UI reads configuration from the environment or a small JSON config if present. Check `vite.config.js` and `src/` for configurable constants.

## Development notes
- Components live under `src/components/`.
- Main entry is `src/main.jsx` and top-level layout in `src/App.jsx`.

## Contributing
- Fork the repo, create a feature branch, and open a pull request.
- Keep changes focused and add a short description of the user-visible behavior.
- Run linting and tests (if any) before submitting.

## Troubleshooting
- If the dev server doesn't start, verify Node and npm versions and that port `5173` is free.
- Check the browser console for errors related to CORS or file access when loading local files.

## License
See the `LICENSE` file in the repository root.
