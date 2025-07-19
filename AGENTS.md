# AGENTS Instructions

## Code Style
- Use a single central script `js/app.js` without ES modules.
- Keep JavaScript simple and vanilla. Avoid unused files.

## Testing
Use the built‑in python web server to test the site:

```bash
python3 -m http.server 8001 >/tmp/server.log 2>&1 &
kill %1
```
