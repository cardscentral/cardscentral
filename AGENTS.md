# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Running E2E Tests (Maestro)

### Prerequisites

1. **iOS Simulator** must be booted (iPhone 16 with iOS 26.5):
   ```bash
   xcrun simctl list devices booted
   ```

2. **App must be installed** on the simulator as a dev client build (`com.cardscentral.app`):
   ```bash
   xcrun simctl listapps booted | grep cardscentral
   ```

3. **Expo dev client server** must be running (NOT Expo Go):
   ```bash
   npx expo start --dev-client
   ```
   Wait until you see "Logs for your project will appear below." before running tests.

4. **Maestro CLI** is installed at: `/Users/butkovic/.maestro/bin/maestro`

### Running Tests

Run individual flows:
```bash
/Users/butkovic/.maestro/bin/maestro test .maestro/flows/02-add-card.yaml
```

Run multiple flows sequentially:
```bash
/Users/butkovic/.maestro/bin/maestro test .maestro/flows/01-country-selection.yaml .maestro/flows/02-add-card.yaml
```

Run all flows:
```bash
/Users/butkovic/.maestro/bin/maestro test .maestro/flows/
```

### Flow Dependencies

- **Flow 01** (country-selection): Clears app state and selects Slovakia. Must run first on a fresh install.
- **Flow 02** (add-card): Requires country already selected (flow 01).
- **Flows 03-05** (view/edit/delete card): Require a card to exist (flow 02).
- **Flow 07** (search-shops): Requires country selected.
- **Flow 09** (scan-barcode): Requires test assets injected and country selected.

### Important Notes

- After selecting SK (Slovakia) as country, the app language switches to **Slovak**. Maestro flows use `testID` attributes (not text) for assertions to avoid i18n issues.
- On iOS 26.5, `hideKeyboard` may fail. Use `pressKey: Enter` or tap a non-interactive element instead.
- When running multiple flows in sequence, Maestro may encounter connection issues between flows. If a flow fails with "Failed to connect", retry it individually.
- Debug output (logs & screenshots) is saved to: `/Users/butkovic/.maestro/tests/`

### TypeScript Type Checking

```bash
npx tsc --noEmit
```

### Rebuilding the Dev Client

If the native app build is stale:
```bash
npx expo prebuild --platform ios --clean
cd ios && xcodebuild -workspace cardscentral.xcworkspace -scheme cardscentral -configuration Debug -sdk iphonesimulator -derivedDataPath build build
```
