# Contributing to Cards Central

Thank you for your interest in contributing to Cards Central! This guide goes deeper than the [README](README.md) — start there for the quick version.

## Adding a New Shop

The most common (and most welcome!) contribution is adding support for a new loyalty card. It takes **one small YAML file — no coding required**, and you can even do it right in the GitHub web editor.

### Step 1: Create a YAML configuration

Create a new file: `src/config/shops/<shop-id>.yaml`

```yaml
id: my-shop          # Unique identifier, kebab-case (e.g. "tesco", "dm-cz")
name: "My Shop"      # Display name shown in the app
description: "My Shop Loyalty Card"
country: SK          # ISO 3166-1 alpha-2 country code (SK, CZ, DE, PL, ...)
category: fashion    # fashion, groceries, electronics, petrol, pharmacy, home, sports, other
barcode_type: ean13  # See supported types below
brand:
  primary_color: "#FF0000"    # Main brand color (used as the card background)
  secondary_color: "#FFFFFF"  # Secondary color
  text_color: "#FFFFFF"       # Text/icon color on top of the primary color
  logo: siMyshop              # Optional — simple-icons slug (see below)
```

Not sure about a value? Open any existing file in [`src/config/shops/`](src/config/shops/) to see real examples, or just leave the optional fields out.

#### Supported Barcode Types

| Type | Description | Common Usage |
|------|-------------|--------------|
| `ean13` | EAN-13 (13 digits) | Most loyalty cards |
| `ean8` | EAN-8 (8 digits) | Smaller cards |
| `code128` | Code 128 | Alphanumeric cards |
| `code39` | Code 39 | Older systems |
| `qr` | QR Code | Digital/app-based cards |
| `pdf417` | PDF417 | Some transit/ID cards |
| `aztec` | Aztec Code | Tickets |

#### Finding a logo

The optional `logo` field uses a [simple-icons](https://simpleicons.org/) slug: search for the brand there and use `si` + the icon name in PascalCase — e.g. "Lidl" → `siLidl`, "H&M" → `siHandm`. If the brand isn't listed, simply omit the `logo` field and the app will show the first letter of the shop name in its brand colors.

#### Finding Brand Colors

- Look at the physical loyalty card
- Check the shop's website or app
- Use a color picker tool on their logo
- The `primary_color` should match the card's dominant color

### Step 2: (Optional) Link the shop's official app

If the store has its own app, add an `apps` block so users can jump to it:

```yaml
apps:
  ios:
    store_id: "834465911"        # App Store numeric id
  android:
    package: "com.hm.goe"        # Play Store package id
    scheme: "hmapp://"           # optional deep-link scheme
```

The app only shows the store button once the reference is confirmed to exist, so it's fine to leave this out if you're unsure. To verify (and strip any dead references):

```bash
npm run verify:app-links          # HTTP-checks every shop's store refs
npm run verify:app-links:fix      # removes any dead refs from the YAML
```

### Step 3: Generate the registry

```bash
npm run generate:shops
```

This reads all YAML files and generates `src/config/shops.generated.ts` automatically. **You do not need to edit any TypeScript files manually.**

### Step 4: Verify

```bash
npm run typecheck   # check everything compiles
npm start           # start the app and see your shop in the list
```

### Step 5: Submit a Pull Request

1. Fork the repo
2. Create a branch: `git checkout -b add-shop/shop-name`
3. Add your YAML file and run `npm run generate:shops`
4. Submit a PR with a screenshot of the shop in the card list (and a reference to the physical card if possible)

Not comfortable with pull requests? No problem — [open an issue](https://github.com/cardscentral/cardscentral/issues/new) with the shop details and we'll add it for you.

## Development Setup

You'll need **Node.js 20+** and npm.

```bash
git clone https://github.com/cardscentral/cardscentral.git
cd cardscentral
npm install

npm run generate:shops   # generate shop registry from YAML
npm start                # start the dev server
npm run ios              # run on iOS
npm run android          # run on Android
npm run web              # run in the browser
```

### Running the PWA locally

```bash
npm run build:web && npm run serve:web   # → http://localhost:4173/cardscentral/
```

The build (`scripts/build-web.js`) runs `expo export --platform web`, injects the PWA `<head>` tags + service-worker registration, rewrites the base path in the manifest + service worker, and writes an SPA fallback. The base path is configurable via the `BASE_PATH` env var (`/` for the landing page, `/app/` for prod, `/qa/` for QA).

## Testing

### Native (iOS/Android) — Maestro

Native flows use [Maestro](https://maestro.mobile.dev/). Install it once:

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

Boot a simulator/emulator with the app installed, then:

```bash
make maestro-ios                      # run all flows on iOS
make maestro-android                  # run all flows on Android
make maestro-flow FLOW=02-add-card    # run a single flow
make maestro-studio                   # open Maestro Studio (visual builder)
```

Flows live in `.maestro/flows/`. Run `make help` to see every available target.

### Web / PWA — Playwright

Web flows use [Playwright](https://playwright.dev/) and drive the production web build in a headless browser — no simulator needed, so they're the quickest way to check UI changes. Because `react-native-web` renders each RN `testID` as `data-testid`, the web specs reuse the same selectors as the Maestro flows.

```bash
make e2e-web-install   # one-time: install the headless browser
make e2e-web           # build, serve dist/, and run the whole suite
make e2e-web-ui        # interactive UI mode
make e2e-web-report    # open the last HTML report
```

Specs live in `e2e-web/` and are numbered to match the Maestro flows in `.maestro/flows/`, so the shared UI logic is covered on both sides.

## Code Guidelines

- Use TypeScript for all source files
- Follow existing code patterns
- Add `testID` props to interactive elements for E2E testing
- YAML is the single source of truth for shop config — never edit `shops.generated.ts`

## PR Checklist

- [ ] YAML config file created in `src/config/shops/`
- [ ] `npm run generate:shops` executed successfully
- [ ] Brand colors match the physical card
- [ ] Correct barcode type and category selected
- [ ] Logo slug (if used) exists on [simpleicons.org](https://simpleicons.org/)
- [ ] App compiles and runs without errors (`npm run typecheck`)

## CI/CD & Releases

- **CI** runs on every push and PR to `main` (typecheck + E2E suites).
- **Web / PWA** is published as an installable Progressive Web App on GitHub Pages from the [`cardscentral/cardscentral.github.io`](https://github.com/cardscentral/cardscentral.github.io) repo: QA (`/qa/`) refreshes on every push to `main`, and Production (`/app/`) plus the landing page redeploy when a GitHub Release is published.

Cutting a versioned release (tags, native store builds, and the prod web deploy) is a maintainer task — see **[RELEASING.md](RELEASING.md)** for the full checklist.


## Questions?

Open an issue with the label `question` and we'll help you out!
