# AGENTS Instructions

## Code Style
- JavaScript is organized as multiple ES modules under `src/`.
- The entry point is `src/app.js` and code is bundled with Rollup into `js/app.js`.
- Keep JavaScript simple and vanilla. Avoid unused files.
- Ignore `node_modules/` via `.gitignore`.

## Build Instructions
Run the bundler to generate `js/app.js`:

```bash
npm install
npm run build
```

## Testing
Use the built‑in python web server to test the site:
```bash
python3 -m http.server 8001 >/tmp/server.log 2>&1 &
kill %1
```
