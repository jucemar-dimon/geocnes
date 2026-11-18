# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GEOCNES is a client-side-only web app (Portuguese / pt-BR UI) for managers of Brazil's CNES health-establishment registry. The user uploads the `.zip` extract downloaded from the CNES portal; the app unzips it in the browser, parses the CSV, and shows establishments of a chosen UF/municipality on a Google Map along with a table and two pie charts summarizing geolocation coverage (with geo, without geo, and "doubtful" geo = coordinates shared by more than one establishment). There is no backend.

Identifiers, functions, CSS classes and UI text are in Portuguese (e.g. `estabelecimentos`, `carregarMunicipios`, `limpar`); keep that convention.

## Commands

Requires Node >= 22.15 (`engines` in `package.json`).

- `npm ci` — install exactly from `package-lock.json` (what CI uses; keep the lockfile in sync when changing deps)
- `npm start` — webpack-dev-server on port 9000, serving `./public`
- `npm run build` — production build (`NODE_ENV=production`) into `./public` (`main.js`, `estilo.css`, `images/`, plus everything from `src/static/`)

There are no tests or linter configured; validate changes with `npm run build` and by exercising the app in the browser (needs a real CNES `.zip` and a valid Maps key).

`GOOGLEMAPS_GOOGLEMAPS_APIKEY` must be defined, either in a `.env` file (gitignored) or as an environment variable; it is injected at build time via `dotenv-webpack` and read in [src/js/google-maps-api.js](src/js/google-maps-api.js). If it is missing the build still succeeds silently, but the key compiles to `undefined` and the map does not load — check this first when the map fails. For `npm start`, the key's HTTP-referrer restrictions must allow `http://localhost:9000/*`.

The build emits asset-size warnings (`main.js` ~500 KiB, `lat-lon-munic.json` ~480 KiB). Most of `main.js` is `moment` with all its locales, pulled in by Chart.js v2; the warnings are expected and not errors.

## Build output vs. deployed site

- `public/` is the webpack output and is gitignored. Webpack does not generate an HTML page; the hand-maintained files in `src/static/` (`index.html`, the zip.js library files `zip.js`/`inflate.js`/`deflate.js`/`z-worker.js`, `lat-lon-munic.json`, `images/favicon.ico`) are copied as-is into `public/` by `CopyWebpackPlugin`, together with `src/assets/images`.
- Deployment is done by [.github/workflows/deploy.yml](.github/workflows/deploy.yml): on every push to `master` it builds (Node 22, per `engines` in `package.json`) and publishes `public/` to GitHub Pages (Settings → Pages → Source must be "GitHub Actions"). The Maps key comes from the repository secret `GOOGLEMAPS_GOOGLEMAPS_APIKEY`; `dotenv-webpack` runs with `systemvars: true` so it reads the CI environment when there is no `.env`. Built files are no longer committed.
- The Maps key is inlined in the browser bundle, so it is visible to visitors; protection relies on HTTP-referrer and API restrictions configured in Google Cloud.

## Architecture

- Entry point [src/js/principal.js](src/js/principal.js) holds nearly all logic as module-level state and plain functions, imperatively wired to DOM ids defined in [src/static/index.html](src/static/index.html) (`comboUf`, `comboMunicipio`, `inputFile`, `btn-filtrar`, `tabela`, `grafico1`/`grafico2`, `#dashboard`, `#resultados`, etc.). Changing an element id requires changing both files.
- **Globals not bundled:** jQuery (`$`) is loaded from a CDN script tag and the zip.js library exposes a global `zip`; both are used in `principal.js` without imports.
- **Data flow:** file input → `lerArquivo` (zip.js, `useWebWorkers = false`) → `convertToJSON` (PapaParse with `header: true`, `dynamicTyping: true`, header spaces replaced by `_`) → `estabelecimentos` array. A file is valid only if rows have an `IBGE` column. Other columns used: `UF`, `MUNICIPIO`, `CNES`, `NOME_FANTASIA`, `RAZAO_SOCIAL`, `LATITUDE`, `LONGITUDE`, `LOGRADOURO`, `NUMERO`, `BAIRRO`, `CEP`.
- UF combo is populated from distinct `UF` values in the data; municipality combo from distinct `IBGE`/`MUNICIPIO` within the UF. Filtering matches on the first 7 chars of the selected IBGE code.
- Map centering: UFs use the static map in [src/js/lat-lon-ufs.js](src/js/lat-lon-ufs.js); municipalities are looked up at runtime by fetching `lat-lon-munic.json` via a relative URL (matched by `codigo_ibge` prefix).
- [src/js/dashboard.js](src/js/dashboard.js) `DataDashboard` computes the counts/percentages for the stat boxes and Chart.js (v2 API) pie charts; markers are grouped with `node-js-marker-clusterer`, whose cluster icons are loaded from an external `imagePath` URL set in `criarMarkers`.
- Not actually used: [src/js/lista-ufs.js](src/js/lista-ufs.js) and the dependencies `csvtojson`, `google-maps` and `@google/markerclusterer` (none are imported).
