/**
 * ShopIcon Component
 *
 * Displays a branded icon for a shop. Priority:
 * 1. Official brand SVG logo from `simple-icons` npm package (if brand.logo is set)
 * 2. Favicon PNG fetched from Google (if available in assets/logos/)
 * 3. Two-letter abbreviation in brand colors (final fallback)
 *
 * SVG logos: sourced from `simple-icons` npm dependency (CC0, 3400+ brands)
 * PNG logos: fetched from Google Favicons during build (`npm run fetch:logos`)
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShopBrand } from '../types';
import { brandIcons } from '../config/brand-icons.generated';
import { logoAssets } from '../config/logo-assets.generated';

interface ShopIconProps {
  brand: ShopBrand;
  /** Shop ID — used to look up fetched favicon PNG */
  shopId?: string;
  /** Shop name — used for 2-letter fallback */
  name?: string;
  size?: number;
  /**
   * When true, an "app available" badge is overlaid on the corner of the tile
   * to signal that this shop has a dedicated official app.
   */
  hasApp?: boolean;
}

function renderBrandLogo(logoSlug: string, size: number, color: string) {
  const iconData = brandIcons[logoSlug];
  if (!iconData) return null;

  const svgSize = size * 0.62;

  return (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill={color}>
      <Path d={iconData.path} />
    </Svg>
  );
}

function renderFaviconLogo(shopId: string, size: number) {
  const asset = logoAssets[shopId];
  if (!asset) return null;

  const imgSize = size * 0.68;

  return (
    <Image
      source={asset}
      style={{ width: imgSize, height: imgSize }}
      resizeMode="contain"
    />
  );
}



function renderLetterFallback(name: string, size: number, color: string) {
  const words = name.trim().split(/\s+/);
  const letters = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return (
    <Text style={{ fontSize: size * 0.38, fontWeight: '800', color, letterSpacing: -0.5 }}>
      {letters}
    </Text>
  );
}

export function ShopIcon({ brand, shopId, name, size = 48, hasApp = false }: ShopIconProps) {
  let content: React.ReactNode;
  // The tile background depends on which logo source we use:
  //  - simple-icons SVG: monochrome, drawn in text_color, so it needs the
  //    brand color behind it for contrast.
  //  - favicon PNG: already full-color with its own background baked in, so a
  //    neutral light tile keeps it clean and avoids clashing with the brand
  //    color (which previously produced odd colored borders).
  //  - letter fallback: brand color tile with the letters in text_color.
  let backgroundColor = brand.primary_color;

  if (brand.logo && brandIcons[brand.logo]) {
    // Priority 1: Official SVG brand logo from simple-icons
    content = renderBrandLogo(brand.logo, size, brand.text_color);
  } else if (shopId && logoAssets[shopId]) {
    // Priority 2: Favicon PNG from Google (fetched at build time)
    content = renderFaviconLogo(shopId, size);
    backgroundColor = '#FFFFFF';
  } else {
    // Priority 3: 2-letter abbreviation in brand colors
    content = renderLetterFallback(name || 'CC', size, brand.text_color);
  }

  // Outer wrapper is needed so the "app available" badge can overflow past the
  // tile's clipped (overflow: hidden) rounded corners.
  const badgeSize = Math.max(14, size * 0.34);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size * 0.2,
            backgroundColor,
          },
        ]}
      >
        {content}
      </View>

      {hasApp && (
        <View
          style={[
            styles.appBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -badgeSize * 0.28,
              bottom: -badgeSize * 0.28,
            },
          ]}
          testID="shop-app-badge"
        >
          <MaterialCommunityIcons
            name="cellphone-arrow-down"
            size={badgeSize * 0.66}
            color="#FFFFFF"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  appBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
