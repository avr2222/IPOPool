# IPO Pool — working notes

Static PWA (React via CDN, Supabase backend). No bundler at runtime.

## Build step (important)
The browser loads **precompiled** JS from `build/*.js`, not the `src/*.jsx`
source. After editing ANY `src/*.jsx`, regenerate the build or the change
won't reach the app:

```
npm install   # once, to get @babel/core + @babel/preset-react
npm run build # transpiles src/*.jsx -> build/*.js
```

`build/*.js` is committed (the deploy just serves the repo). Never hand-edit
`build/*.js` — edit the `src/*.jsx` and rebuild. Plain-JS files
(`src/db.js`, `src/supabase-client.js`, `src/qrcode.js`) are loaded directly,
no build needed.

## Deploys
Bump `CACHE` in `sw.js` (e.g. `ipo-pool-vNN`) on every deploy so the service
worker picks up changes.

## Supabase migrations
SQL in `supabase/migrations/`. Apply new ones in order in the Supabase SQL
editor. The internal group-pooling feature needs migrations through 026.
