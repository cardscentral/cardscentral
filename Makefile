# Cards Central - Development & Testing Commands
# Same commands work locally and in CI

.PHONY: install generate typecheck prebuild build-web maestro maestro-ios maestro-android clean help e2e-web e2e-web-install e2e-web-ui e2e-web-report ci ci-e2e-ios ci-e2e-android ci-e2e-web dev

# ──────────────────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────────────────

install: ## Install all dependencies
	npm ci

generate: ## Generate shop registry from YAML
	npm run generate:shops

typecheck: generate ## Type-check the project
	npx tsc --noEmit

# ──────────────────────────────────────────────────────────────
# Build
# ──────────────────────────────────────────────────────────────

prebuild: ## Generate native projects (iOS + Android)
	npx expo prebuild --clean

prebuild-ios: ## Generate native project (iOS only)
	npx expo prebuild --platform ios --clean

prebuild-android: ## Generate native project (Android only)
	npx expo prebuild --platform android --clean

build-ios-debug: prebuild-ios ## Build iOS debug for testing
	# The iOS project name is derived by `expo prebuild` from expo.name in
	# app.json (e.g. "Cards Central" -> "CardsCentral"), so detect the actual
	# .xcworkspace on disk instead of hardcoding a name that can drift.
	cd ios && \
		WORKSPACE=$$(ls -d *.xcworkspace | head -n1) && \
		SCHEME=$$(basename "$$WORKSPACE" .xcworkspace) && \
		echo "Building workspace $$WORKSPACE (scheme $$SCHEME)" && \
		xcodebuild -workspace "$$WORKSPACE" \
			-scheme "$$SCHEME" \
			-configuration Debug \
			-sdk iphonesimulator \
			-derivedDataPath build \
			build

build-android-debug: prebuild-android ## Build Android debug for testing
	cd android && ./gradlew assembleDebug

build-web: ## Build the installable PWA into dist/ (for GitHub Pages)
	npm run build:web

# ──────────────────────────────────────────────────────────────
# E2E Testing with Maestro (recommended)
# ──────────────────────────────────────────────────────────────

maestro: maestro-ios ## Run Maestro E2E tests (default: iOS)

maestro-ios: ## Run all Maestro flows on iOS simulator
	@echo "🧪 Running Maestro E2E tests (iOS)..."
	maestro test .maestro/flows/

maestro-android: ## Run all Maestro flows on Android emulator
	@echo "🧪 Running Maestro E2E tests (Android)..."
	maestro test .maestro/flows/

maestro-flow: ## Run a single Maestro flow (usage: make maestro-flow FLOW=01-country-selection)
	maestro test .maestro/flows/$(FLOW).yaml

maestro-studio: ## Open Maestro Studio for interactive test creation
	maestro studio

# ──────────────────────────────────────────────────────────────
# E2E Testing with Detox (advanced)
# ──────────────────────────────────────────────────────────────

detox-build-ios: prebuild-ios ## Build for Detox iOS
	detox build --configuration ios.sim.debug

detox-build-android: prebuild-android ## Build for Detox Android
	detox build --configuration android.emu.debug

detox-test-ios: ## Run Detox tests on iOS
	detox test --configuration ios.sim.debug --cleanup

detox-test-android: ## Run Detox tests on Android
	detox test --configuration android.emu.debug --cleanup

# ──────────────────────────────────────────────────────────────
# Full CI pipeline (mirrors GitHub Actions)
# ──────────────────────────────────────────────────────────────

ci: install typecheck ## Run CI checks (install + typecheck)

ci-e2e-ios: ci build-ios-debug maestro-ios ## Full CI E2E pipeline (iOS)

ci-e2e-android: ci build-android-debug maestro-android ## Full CI E2E pipeline (Android)

ci-e2e-web: ci e2e-web-install e2e-web ## Full CI E2E pipeline (Web/PWA)

# ──────────────────────────────────────────────────────────────
# E2E Testing on Web / PWA with Playwright
#
# Drives the production web build (dist/) in a headless browser, reusing the
# same testIDs as the Maestro native flows. playwright.config.ts builds + serves
# the app automatically, so `make e2e-web` is all you need after installing.
# ──────────────────────────────────────────────────────────────

e2e-web-install: ## Install Playwright's browser binaries (one-time)
	npx playwright install --with-deps chromium

e2e-web: ## Run the web/PWA E2E suite (builds + serves dist/ automatically)
	npm run e2e:web

e2e-web-ui: ## Run the web/PWA E2E suite in Playwright's interactive UI mode
	npm run e2e:web:ui

e2e-web-report: ## Open the last web E2E HTML report
	npm run e2e:web:report

# ──────────────────────────────────────────────────────────────
# Utilities
# ──────────────────────────────────────────────────────────────

clean: ## Clean all build artifacts
	rm -rf ios android node_modules .expo dist artifacts
	rm -f src/config/shops.generated.ts

dev: ## Start development server
	npm start

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
