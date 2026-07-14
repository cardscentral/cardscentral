# Cards Central 💳

Your loyalty cards in one place. A React Native (Expo) mobile app for storing and managing loyalty cards from retailers across Europe and popular worldwide brands. Pick your country and the app localizes itself and surfaces the shops most relevant to you.


## 🚀 Try it now (no install needed)

**[🌐 Visit the site](https://cardscentral.github.io/cardscentral/)** — the marketing landing page that explains what the app does, with screenshots. Every button on it opens the **Production** app.

**[▶ Open the web app (Production)](https://cardscentral.github.io/cardscentral/app/)** — it's an installable **PWA**, so there are no App Store / Play Store fees required to use it.

> 🧪 Prefer the bleeding edge? Try the **[QA build](https://cardscentral.github.io/cardscentral/qa/)** — it always tracks the latest code merged to `main`.

| Stage | URL | Deployed when |
|-------|-----|---------------|
| **Site (landing)** | https://cardscentral.github.io/cardscentral/ | A GitHub Release is published (links to Production only) |
| **Production (PWA)** | https://cardscentral.github.io/cardscentral/app/ | A GitHub Release is published |
| **QA (PWA)** | https://cardscentral.github.io/cardscentral/qa/ | Every push to `main` |




- **iPhone/iPad (Safari):** tap **Share → Add to Home Screen**
- **Android (Chrome):** tap **⋮ → Install app / Add to Home Screen**
- **Desktop (Chrome/Edge):** click the **install** icon in the address bar

Once added, it launches full-screen like a native app and works offline (data stays on your device).

## Features


- 📋 **List & manage** your loyalty cards
- 📷 **Scan barcodes** with your camera to add cards instantly
- 🎨 **Shop branding** - each card displays in the shop's brand colors
- 📊 **Multiple barcode types** - EAN-13, Code 128, QR codes, and more
- 🔧 **Easy to extend** - add new shops via YAML configuration
- ☁️ **Premium sync ready** - backend sync placeholder for future implementation

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode 15+ (for iOS development)
- Android: Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone https://github.com/cardscentral/cardscentral.git
cd cardscentral

# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Running E2E Tests

We use **[Maestro](https://maestro.mobile.dev/)** for E2E testing — YAML-based flows that work identically locally and in CI. No Docker needed.

#### Step 1: Install Maestro (one-time)

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

Verify:
```bash
maestro --version
```

#### Step 2: Set up a simulator/emulator

Maestro requires a running simulator or emulator. Choose one:

<details>
<summary><strong>🍎 iOS Simulator (macOS + Xcode)</strong></summary>

```bash
# 1. Accept Xcode license (one-time, requires sudo)
sudo xcodebuild -license accept

# 2. Download iOS simulator runtime matching your Xcode version (one-time, ~8GB)
#    This automatically picks the correct version for your Xcode installation.
xcodebuild -downloadPlatform iOS

# 3. Check what runtime was installed
xcrun simctl list runtimes
# Example output: iOS 26.5 (26.5 - 23F77) - com.apple.CoreSimulator.SimRuntime.iOS-26-5

# 4. Check available device types
xcrun simctl list devicetypes | grep iPhone

# 5. Create a simulator (use the runtime identifier from step 3)
#    Replace the runtime ID to match your installed version
xcrun simctl create "iPhone 16" \
  "com.apple.CoreSimulator.SimDeviceType.iPhone-16" \
  "com.apple.CoreSimulator.SimRuntime.iOS-26-5"

# 6. Boot the simulator
xcrun simctl boot "iPhone 16"

# 7. Open the Simulator app to see the screen
open -a Simulator

# 8. Verify it's running
xcrun simctl list devices | grep Booted
```

> **Tip:** If xcodebuild fails with "not agreed to license", run step 1 first.
> If the build says "iOS X.Y is not installed", your runtime version doesn't match Xcode.
> Always run `xcodebuild -downloadPlatform iOS` to get the matching version.

</details>

<details>
<summary><strong>🤖 Android Emulator (Android Studio)</strong></summary>

**Option A: Via Android Studio GUI (recommended)**

1. Open Android Studio → **Device Manager** (right sidebar)
2. Click **Create Virtual Device**
3. Select **Pixel 6** (or any phone) → **Next**
4. Download a system image (API 34, x86_64) → **Next** → **Finish**
5. Click the ▶️ play button to boot the emulator

**Option B: Via command line**

```bash
# Add SDK tools to PATH (add to your ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH

# List available system images
sdkmanager --list | grep "system-images"

# Download a system image
sdkmanager "system-images;android-34;google_apis;arm64-v8a"

# Create an AVD
avdmanager create avd -n Pixel_6 -k "system-images;android-34;google_apis;arm64-v8a" -d pixel_6

# Boot the emulator
emulator -avd Pixel_6
```

**Verify the emulator is running:**
```bash
adb devices
# Should show: emulator-5554  device
```

</details>

#### Step 3: Build the app for your simulator/emulator

**iOS:**
```bash
make build-ios-debug
# Prebuild + xcodebuild for iphonesimulator
```

**Android:**
```bash
make build-android-debug
# Prebuild + ./gradlew assembleDebug
```

**Install on device (if not using `npx expo run:*`):**
```bash
# iOS
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/cardscentral.app

# Android
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 4: Run all E2E test flows

Make sure a simulator/emulator is running with the app installed, then:

```bash
# Run ALL flows on iOS simulator:
maestro test .maestro/flows/

# Or via Makefile:
make maestro-ios        # iOS
make maestro-android    # Android
```

#### Step 4: Run a single flow

```bash
# Direct Maestro command:
maestro test .maestro/flows/01-country-selection.yaml
maestro test .maestro/flows/02-add-card.yaml
maestro test .maestro/flows/03-view-card-detail.yaml
maestro test .maestro/flows/04-edit-card.yaml
maestro test .maestro/flows/05-delete-card.yaml

# Or via Makefile:
make maestro-flow FLOW=02-add-card
```

#### Step 5: Maestro Studio (interactive test builder)

Launch the visual studio to create, debug, and record flows interactively:

```bash
maestro studio

# Or via Makefile:
make maestro-studio
```

This opens a browser UI at `http://localhost:9999` where you can:
- See the device screen in real-time
- Click elements to generate test steps
- Record interactions as YAML
- Debug failing flows step-by-step

#### Generate test reports (CI)

```bash
maestro test .maestro/flows/ --format junit --output report.xml
```

#### Target a specific device

```bash
maestro test .maestro/flows/ --device "iPhone 16"
maestro test .maestro/flows/ --device "emulator-5554"
```

#### Full CI pipeline locally

```bash
make ci-e2e-ios         # install → typecheck → build iOS → run all Maestro flows
make ci-e2e-android     # install → typecheck → build Android → run all Maestro flows
```

#### Maestro Flows (`.maestro/flows/`)

| Flow | Description |
|------|-------------|
| `01-country-selection` | First launch — select Slovakia |
| `02-add-card` | Add a new Tesco loyalty card |
| `03-view-card-detail` | View card detail with barcode |
| `04-edit-card` | Edit card nickname |
| `05-delete-card` | Delete a card |

#### All Make targets

```bash
make help               # Show all available commands
make ci                 # Run same checks as CI (install + typecheck)
make maestro-ios        # Run Maestro flows on iOS
make maestro-android    # Run Maestro flows on Android
make maestro-flow FLOW=02-add-card   # Run single flow
make maestro-studio     # Open Maestro Studio
make ci-e2e-ios         # Full CI E2E pipeline (iOS)
make ci-e2e-android     # Full CI E2E pipeline (Android)
make detox-test-ios     # Run Detox tests (advanced, alternative)
```

#### Web / PWA E2E (Playwright)

The mobile flows above are mirrored by a **[Playwright](https://playwright.dev/)** suite that drives the **production web build** (`dist/`) in a headless browser. Because `react-native-web` renders each RN `testID` as `data-testid`, the web specs reuse the exact same selectors as the Maestro flows — so the shared UI logic (add / view / edit card, shop search, grid toggle, VoucherVault import, settings, official-app links) gets fast, emulator-free coverage on every PR.

```bash
# One-time: install the headless browser
make e2e-web-install         # or: npx playwright install --with-deps chromium

# Run the whole suite (builds + serves dist/ automatically)
make e2e-web                 # or: npm run e2e:web

# Interactive UI mode / open the last HTML report
make e2e-web-ui              # or: npm run e2e:web:ui
make e2e-web-report          # or: npm run e2e:web:report
```

Specs live in `e2e-web/` (`01-*.spec.ts` … `12-*.spec.ts`) and are numbered to match the Maestro flows. A few flows are **native-only** and can't run in a browser:

- **`09-scan-barcode`** — needs the device camera / photo-library picker, so it's `test.skip`-ped on web and covered only by Maestro.
- **Destructive confirms** (delete card, clear data) and the **language switch** use a multi-button `Alert.alert`, which `react-native-web` renders as a no-op. On web those specs assert the reachable affordance (e.g. the delete button, the localized default language) instead of the native confirmation result.

CI runs this suite via `.github/workflows/e2e-web.yml`; run the full pipeline locally with `make ci-e2e-web`.

#### Why Maestro over Detox / Docker?


- **Same commands locally and in CI** — no Docker needed for mobile E2E
- **YAML-based** — flows are readable, no TypeScript test code to compile
- **Fast** — direct UI interaction, no test runner overhead
- **Studio mode** — visual debugger for creating and fixing tests
- **Works on real simulators/emulators** — GPU-accelerated, accurate results
- **Detox still available** for advanced testing (see `make detox-*` targets)

> **Note:** Docker-compose doesn't work for mobile E2E tests because iOS simulators require macOS + Xcode, and Android emulators need KVM + GPU access. The standard approach is native simulator/emulator with Maestro in CI (GitHub Actions provides both macOS + Linux runners with KVM).

## Project Structure

```
cardscentral/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BarcodeDisplay.tsx
│   │   ├── CardListItem.tsx
│   │   └── ShopIcon.tsx
│   ├── config/
│   │   ├── shops/        # YAML shop configurations
│   │   │   ├── hm.yaml
│   │   │   ├── ca.yaml
│   │   │   ├── tako-fashion.yaml
│   │   │   ├── dm.yaml
│   │   │   └── lidl.yaml
│   │   └── shops.ts      # Shop registry (compiled from YAML)
│   ├── navigation/       # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # App screens
│   │   ├── CardsListScreen.tsx
│   │   ├── CardDetailScreen.tsx
│   │   ├── AddCardScreen.tsx
│   │   ├── EditCardScreen.tsx
│   │   ├── ScanBarcodeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── storage/          # Data persistence
│   │   ├── cardStorage.ts
│   │   └── syncService.ts  # Premium sync placeholder
│   └── types/            # TypeScript type definitions
│       └── index.ts
├── e2e/                  # Detox E2E tests
│   ├── jest.config.js
│   └── cards.test.ts
├── .github/workflows/    # CI/CD pipelines
│   ├── ci.yml            # Lint, type check, E2E tests
│   └── build-deploy.yml  # Build & deploy to stores
├── .detoxrc.js           # Detox configuration
├── eas.json              # EAS Build configuration
└── app.json              # Expo configuration
```

## Adding a New Shop

Want to add support for a new shop? It's easy! **Just add one YAML file:**

### 1. Create a YAML configuration file

Create a new file in `src/config/shops/<shop-id>.yaml`:

```yaml
# Shop Loyalty Card Configuration
id: my-shop          # Unique identifier (kebab-case)
name: "My Shop"      # Display name
description: "My Shop Loyalty Card"
country: SK          # ISO country code
category: fashion    # One of: fashion, groceries, electronics, petrol, pharmacy, home, sports, other
barcode_type: ean13  # One of: ean13, ean8, code128, code39, qr, pdf417, aztec
brand:
  logo: siMyshop              # Optional: simple-icons slug (browse https://simpleicons.org/)
  primary_color: "#FF0000"    # Main brand color (card background)
  secondary_color: "#FFFFFF"  # Secondary color
  text_color: "#FFFFFF"       # Text/icon color on primary background
```

> **Finding the logo slug:** Go to [simpleicons.org](https://simpleicons.org/), search for the brand, then use the format `si` + PascalCase name. Example: "H&M" → `siHandm`, "Lidl" → `siLidl`. If the brand isn't available, omit the `logo` field — the app will display the first letter of the shop name in brand colors.
```

### 2. Generate the registry

```bash
npm run generate:shops
```

This auto-generates the TypeScript registry from YAML. **No manual TypeScript editing needed.**

### 3. Submit a Pull Request

That's it! Submit your PR and it will be reviewed.

## CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggered on every push and PR to `main`:

1. **Lint & Type Check** - Validates TypeScript types
2. **E2E Tests (iOS)** - Runs Detox tests on iOS simulator
3. **E2E Tests (Android)** - Runs Detox tests on Android emulator

### Web / PWA (`deploy-pwa.yml`)

Ships the app as an **installable Progressive Web App** on **GitHub Pages** — free hosting, no App Store / Play Store fees. Everything is served from the same Pages site as sibling paths so each piece updates independently:

| Target | URL | Trigger |
|--------|-----|---------|
| **Site (landing page)** | `https://<owner>.github.io/cardscentral/` | A GitHub Release is published |
| **Production (PWA)** | `https://<owner>.github.io/cardscentral/app/` | A GitHub Release is published |
| **QA (PWA)** | `https://<owner>.github.io/cardscentral/qa/` | Every push to `main` |

The **site root is the marketing landing page** (`landing/`); every call-to-action on it opens the **Production** PWA at `/app/` — never QA. Regenerate its screenshots with `npm run generate:landing`.

```bash
# Build the PROD PWA locally into dist/ (base path /cardscentral/app/)
BASE_PATH=/cardscentral/app/ npm run build:web

# Build the QA PWA locally (base path /cardscentral/qa/)
BASE_PATH=/cardscentral/qa/ npm run build:web

# Preview it (served under the /cardscentral base path)
npx serve dist -l 3000   # then open http://localhost:3000/cardscentral/app/
```


The build (`scripts/build-web.js`) runs `expo export --platform web`, injects the
PWA `<head>` tags + service-worker registration, rewrites the base path in the
manifest + service worker, and writes `404.html` (SPA fallback) and `.nojekyll`.
The base path is configurable via the `BASE_PATH` env var (default
`/cardscentral/`), which `app.config.js` feeds into Expo's `experiments.baseUrl`.
PWA assets live in `public/` (`manifest.webmanifest`, `sw.js`, `icons/`) and are
copied into `dist/` by Expo.

**One-time GitHub setup:** repo **Settings → Pages → Source = "Deploy from a
branch"**, Branch = **`gh-pages`** / **`(root)`**. All targets publish to the
`gh-pages` branch — landing into the root, prod into `app/`, QA into `qa/` —
using `peaceiris/actions-gh-pages` with `keep_files: true`, so deploying one
target never clobbers the others.


- **QA** redeploys automatically on **every push to `main`**, so it always
  reflects the latest merged code.
- **Production** deploys **only when a GitHub Release is published** (releases
  are cut from a git tag), so the live prod site always tracks a tagged version:

```bash
# 1. Tag the release commit and push the tag
git tag v1.2.3
git push origin v1.2.3

# 2. Publish a GitHub Release for that tag (triggers the PROD deploy)
gh release create v1.2.3 --generate-notes
```

`workflow_dispatch` is also enabled for manual re-deploys of any target
(choose `qa`, `prod`, or `landing`).


> The base path defaults to `/cardscentral` (set in `app.json` for native
> builds; overridden per-stage via `BASE_PATH` for the web export). If you
> rename the repo or use a custom domain at the root, update these values and
> the QA sub-path accordingly.


### Build & Deploy (`build-deploy.yml`)


Triggered on version tags (`v*`) or manual dispatch:

1. **Build iOS** - Creates iOS build via EAS Build
2. **Build Android** - Creates Android build via EAS Build
3. **Deploy iOS** - Submits to TestFlight
4. **Deploy Android** - Submits to Google Play Internal Track

### Required Secrets

Configure these in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token |
| `EXPO_APPLE_ID` | Apple ID email |
| `EXPO_APPLE_PASSWORD` | App-specific password |
| `EXPO_APPLE_TEAM_ID` | Apple Developer Team ID |
| `EXPO_ASC_APP_ID` | App Store Connect App ID |
| `EXPO_ANDROID_KEYSTORE_PASSWORD` | Android keystore password |
| `EXPO_ANDROID_KEY_PASSWORD` | Android key password |

## Premium Features (Future)

The app is prepared for premium features that will include:

- ☁️ **Cloud Sync** - Sync cards across multiple devices
- 👥 **Card Sharing** - Share cards with family members
- 🔄 **Cross-device** - Access your cards from any device

These features are stubbed in `src/storage/syncService.ts` and ready for backend implementation.

## Tech Stack

- **Framework**: React Native with Expo SDK 56
- **Language**: TypeScript
- **Navigation**: React Navigation 7
- **Storage**: AsyncStorage (local)
- **Camera**: expo-camera (barcode scanning)
- **E2E Testing**: Maestro (native) + Playwright (web/PWA) + Detox (advanced)

- **CI/CD**: GitHub Actions + EAS Build
- **Build**: Makefile for consistent local/CI commands

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/add-new-shop`)
3. Commit your changes (`git commit -m 'Add new shop: ShopName'`)
4. Push to the branch (`git push origin feature/add-new-shop`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
