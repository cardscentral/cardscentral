# Contributing to Cards Central

Thank you for your interest in contributing to Cards Central! This guide will help you get started.

## Adding a New Shop

The most common contribution is adding support for a new loyalty card. Here's how:

### Step 1: Create a YAML configuration

Create a new file: `src/config/shops/<shop-id>.yaml`

```yaml
# <Shop Name> Loyalty Card Configuration
id: shop-id              # Unique ID, kebab-case (e.g., "my-shop")
name: "Shop Name"        # Full display name
description: "Shop Name Loyalty Card"
country: SK              # ISO 3166-1 alpha-2 country code
barcode_type: ean13      # See supported types below
brand:
  primary_color: "#HEX"  # Main card background color
  secondary_color: "#HEX" # Accent color
  text_color: "#HEX"     # Icon/text color on primary background
  icon:
    set: MaterialCommunityIcons  # Icon set (see below)
    name: store                  # Icon name from the set
```

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

#### Supported Icon Sets

Icons come from [@expo/vector-icons](https://icons.expo.fyi/):

| Set | Browse Icons |
|-----|-------------|
| `MaterialCommunityIcons` | [Browse](https://icons.expo.fyi/Index/MaterialCommunityIcons) |
| `Ionicons` | [Browse](https://icons.expo.fyi/Index/Ionicons) |
| `FontAwesome` | [Browse](https://icons.expo.fyi/Index/FontAwesome) |
| `FontAwesome5` | [Browse](https://icons.expo.fyi/Index/FontAwesome5) |

Browse all icons at: https://icons.expo.fyi/

#### Finding Brand Colors

- Look at the physical loyalty card
- Check the shop's website or app
- Use a color picker tool on their logo
- The `primary_color` should match the card's dominant color

### Step 2: Generate the registry

```bash
npm run generate:shops
```

This reads all YAML files and generates `src/config/shops.generated.ts` automatically. **You do not need to edit any TypeScript files manually.**

### Step 3: Verify

```bash
# Check everything compiles
npm run typecheck

# Start the app and see your shop in the list
npm start
```

### Step 4: Submit a Pull Request

1. Fork the repo
2. Create a branch: `git checkout -b add-shop/shop-name`
3. Add your YAML file
4. Run `npm run generate:shops`
5. Submit a PR with:
   - Screenshot of the shop in the card list
   - Reference to the physical card (if possible)

## Development Setup

```bash
# Install dependencies
npm install

# Generate shop registry from YAML
npm run generate:shops

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Code Guidelines

- Use TypeScript for all source files
- Follow existing code patterns
- Add `testID` props to interactive elements for E2E testing
- YAML is the single source of truth for shop config — never edit `shops.generated.ts`

## PR Checklist

- [ ] YAML config file created in `src/config/shops/`
- [ ] `npm run generate:shops` executed successfully
- [ ] Brand colors match the physical card
- [ ] Correct barcode type selected
- [ ] Icon chosen from @expo/vector-icons (browse at https://icons.expo.fyi/)
- [ ] App runs without errors (`npm run typecheck`)

## Questions?

Open an issue with the label `question` and we'll help you out!
