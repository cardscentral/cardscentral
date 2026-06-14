/**
 * ShopIcon Component
 *
 * Displays a branded icon for a shop. Priority:
 * 1. Official brand SVG logo from `simple-icons` npm package (if brand.logo is set)
 * 2. Two-letter abbreviation in brand colors (for shops not in simple-icons)
 *
 * Brand logos sourced from the `simple-icons` npm dependency (CC0 license, 3400+ brands).
 * No SVGs are stored in this repo — they're extracted at build time via `npm run generate:icons`.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ShopBrand } from '../types';
import { brandIcons } from '../config/brand-icons.generated';

interface ShopIconProps {
  brand: ShopBrand;
  /** Shop name — used for 2-letter fallback when no logo available */
  name?: string;
  size?: number;
}

function renderBrandLogo(logoSlug: string, size: number, color: string) {
  const iconData = brandIcons[logoSlug];
  if (!iconData) return null;

  const svgSize = size * 0.6;

  return (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill={color}>
      <Path d={iconData.path} />
    </Svg>
  );
}

function renderLetterFallback(name: string, size: number, color: string) {
  // Show 2-letter abbreviation: initials for multi-word names, or first 2 chars
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

export function ShopIcon({ brand, name, size = 48 }: ShopIconProps) {
  let content: React.ReactNode;

  if (brand.logo && brandIcons[brand.logo]) {
    // Official brand SVG logo from simple-icons npm package
    content = renderBrandLogo(brand.logo, size, brand.text_color);
  } else {
    // 2-letter abbreviation in brand colors
    content = renderLetterFallback(name || '??', size, brand.text_color);
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
          backgroundColor: brand.primary_color,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
