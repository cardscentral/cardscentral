/**
 * Shop Registry
 *
 * This module re-exports the auto-generated shop registry and provides
 * helper functions for querying shops.
 *
 * The YAML files in src/config/shops/ are the single source of truth.
 * Run "npm run generate:shops" after adding/modifying YAML files.
 *
 * To add a new shop:
 * 1. Create a new YAML file in src/config/shops/<shop-id>.yaml
 * 2. Run: npm run generate:shops
 * 3. Submit a PR
 */

import { ShopConfig, ShopCategory } from '../types';
import { shops } from './shops.generated';

export { shops };

/**
 * Category display names and icons
 */
export const CATEGORY_META: Record<ShopCategory, { label: string; icon: string }> = {
  fashion: { label: 'Fashion & Shoes', icon: 'tshirt-crew' },
  groceries: { label: 'Groceries', icon: 'cart' },
  electronics: { label: 'Electronics', icon: 'laptop' },
  petrol: { label: 'Petrol Stations', icon: 'gas-station' },
  pharmacy: { label: 'Pharmacy & Drugstore', icon: 'pharmacy' },
  home: { label: 'Home & DIY', icon: 'sofa' },
  sports: { label: 'Sports', icon: 'dumbbell' },
  other: { label: 'Other', icon: 'store' },
};

/**
 * Get all available shops as an array
 */
export function getAllShops(): ShopConfig[] {
  return Object.values(shops);
}

/**
 * Get a shop by its ID
 */
export function getShopById(id: string): ShopConfig | undefined {
  return shops[id];
}

/**
 * Get shops filtered by country (includes EU-wide shops for any European country)
 */
export function getShopsByCountry(country: string): ShopConfig[] {
  return Object.values(shops).filter(
    (shop) => shop.country === country || shop.country === 'EU'
  );
}

/**
 * Get shops filtered by category
 */
export function getShopsByCategory(category: ShopCategory): ShopConfig[] {
  return Object.values(shops).filter((shop) => shop.category === category);
}

/**
 * Get shops grouped by category for a country
 */
export function getShopsGroupedByCategory(country: string): Record<ShopCategory, ShopConfig[]> {
  const countryShops = getShopsByCountry(country);
  const groups = {} as Record<ShopCategory, ShopConfig[]>;

  for (const shop of countryShops) {
    const cat = shop.category || 'other';
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(shop);
  }

  // Sort shops within each category alphabetically
  for (const cat of Object.keys(groups) as ShopCategory[]) {
    groups[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}
