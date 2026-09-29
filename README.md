# Enigma Machine Simulator

A TypeScript browser app for simulating an Enigma machine. Vite builds the static site for GitHub Pages at [mckoss.com/enigma-simulator-js](https://mckoss.com/enigma-simulator-js/). The repo also includes a rotor-search solver at `enigma-solver.html`.

## Develop

Requires Node.js 24 or newer.

```sh
npm ci
npm run dev
```

The development server serves the app at `http://localhost:5173/enigma-simulator-js/`.

## Check and build

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm test` runs the former browser unit tests under Vitest. The Playwright command builds the site, starts a preview server, and exercises the deployed assets in Chromium. Install the browser locally with `npx playwright install chromium` if needed. `npm run build` writes the deployable site to `dist/`.

## Deployment

GitHub Pages is configured to deploy from GitHub Actions. A push to `main` runs type checking, unit tests, Playwright tests, and the build. The Pages job then publishes `dist/`. Pull requests run the checks without deploying.

The original code came from the [startpad Google Code snapshot](https://code.google.com/archive/p/startpad/). The Mersenne Twister implementation retains its upstream BSD license notice.
