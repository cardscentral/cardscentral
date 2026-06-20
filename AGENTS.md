# Workflow rules

- **Always propose a commit message before finishing a task.** When wrapping up
  any change, include a suggested commit message that accurately reflects the
  changes made (subject line + body explaining the *why*), so it can be copied
  and used directly.
- **Use Conventional Commits** (https://www.conventionalcommits.org). Format the
  subject as `type(scope): description` — e.g. `feat`, `fix`, `docs`, `ci`,
  `refactor`, `test`, `chore` — keep the description imperative and lowercase,
  and use the body to explain the *why*. Append `!` after the type/scope (or a
  `BREAKING CHANGE:` footer) for breaking changes.


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
# NOTE: scheme/workspace are PascalCase (CardsCentral), and derivedDataPath must
# NOT be `build` — see "CI / native build gotchas" below.
cd ios && xcodebuild -workspace CardsCentral.xcworkspace -scheme CardsCentral -configuration Debug -sdk iphonesimulator -derivedDataPath derived_data build
```

## CI / native build gotchas (READ BEFORE TOUCHING `.github/workflows/ci.yml`)

**Always debug CI from the real logs, never guess. Each run only surfaces ONE
error at a time, so reproduce locally before pushing:**
```bash
gh run list --branch <branch> --limit 5
gh run view <run-id>                      # which step failed
gh run view <run-id> --log-failed --job <job-id> > /tmp/ci.log
```
Build both platforms locally first:
```bash
# iOS  (uses local Xcode 26.x = Swift 6.2+)
npx expo prebuild --platform ios --clean
cd ios && xcodebuild -workspace CardsCentral.xcworkspace -scheme CardsCentral \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath derived_data build
# Android (match CI's Java 17)
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export ANDROID_HOME="$HOME/Library/Android/sdk"
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug --no-daemon
```

Known, log-proven causes (and their fixes already applied to `ci.yml`):

1. **Xcode version (iOS).** Expo SDK 56 SPM packages (`expo-modules-jsi`,
   `@expo/expo-modules-macros-plugin`) declare `swift-tools-version:6.2`, which
   only ships with **Xcode 26** (Swift 6.2). Xcode 16.4 = Swift 6.1, 16.2 =
   Swift 6.0 and both fail with: `package 'apple' is using Swift tools version
   6.2.0 but the installed version is 6.1.0`. The error is raised by the *nested*
   `xcodebuild` in the `ExpoModulesJSI` "Build … xcframework" build phase. → Pin
   `maxim-lobanov/setup-xcode` to `26.x`.

2. **DerivedData path (iOS).** `-derivedDataPath build` collides with React
   Native's fixed codegen dir `ios/build/generated/ios/ReactCodegen` (populated
   by `pod install` during prebuild). Xcode then wipes it on a clean build →
   `error: Build input file cannot be found: …/ReactCodegen/<lib>/<lib>-generated.mm`.
   → Use a separate path, e.g. `-derivedDataPath derived_data` (and install the
   app from `ios/derived_data/...`).

3. **Scheme/workspace casing (iOS).** Expo derives these from `app.json` →
   `CardsCentral.xcworkspace` / scheme `CardsCentral` (PascalCase), bundle id
   `com.cardscentral.app`.

4. **Simulator (iOS).** Runners may not ship a pre-made "iPhone 16"; create one
   against an available runtime, and wait with `xcrun simctl bootstatus <udid> -b`
   before install/launch (`simctl boot` returns before the OS is ready).

5. **Disk space (Android).** prebuild + `gradlew assembleDebug` (NDK, CMake,
   build-tools, ~230 MB APK, caches) exhausts the Ubuntu runner disk; the
   emulator system image then fails with `No space left on device` and the
   emulator never boots (`could not connect to TCP port 5554`). → Add a "Free
   disk space" step (remove unused preinstalled toolchains + `docker image
   prune`) before building.



