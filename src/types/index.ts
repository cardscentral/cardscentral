/**
 * Barcode types supported by the app
 */
export type BarcodeType = 'ean13' | 'ean8' | 'code128' | 'code39' | 'qr' | 'pdf417' | 'aztec';

/**
 * Supported icon sets from @expo/vector-icons
 */
export type IconSet = 'MaterialCommunityIcons' | 'Ionicons' | 'FontAwesome' | 'FontAwesome5';

/**
 * Icon configuration referencing @expo/vector-icons
 */
export interface ShopIcon {
  set: IconSet;
  name: string;
}

/**
 * Shop brand configuration
 */
export interface ShopBrand {
  /** simple-icons slug for official brand SVG logo (e.g. "siLidl") */
  logo?: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  /** @deprecated Fallback icon — prefer logo field */
  icon?: ShopIcon;
}

/**
 * Shop category (optional, kept for backward compatibility with YAML files)
 */
export type ShopCategory = 'fashion' | 'groceries' | 'electronics' | 'petrol' | 'pharmacy' | 'home' | 'sports' | 'other';

/**
 * Official retailer app links for a shop.
 *
 * When present, the app can offer a one-tap "Open app" action that deep-links
 * into the installed app (via `scheme`) and falls back to the platform store
 * page if the app isn't installed.
 */
export interface ShopAppLinks {
  ios?: {
    /** App Store numeric id (e.g. "351493666" -> apps.apple.com/app/id351493666) */
    store_id: string;
    /** Optional URL scheme to deep-link into the installed app (e.g. "tesco://") */
    scheme?: string;
  };
  android?: {
    /** Play Store package id (e.g. "com.tesco.clubcardmobile") */
    package: string;
    /** Optional URL scheme to deep-link into the installed app (e.g. "tesco://") */
    scheme?: string;
  };
}


/**
 * Shop configuration (maps to YAML config files)
 */
export interface ShopConfig {
  id: string;
  name: string;
  description: string;
  country: string;
  /** Website domain — used to fetch favicon logo at build time */
  domain?: string;
  category: ShopCategory;
  barcode_type: BarcodeType;
  brand: ShopBrand;
  /**
   * When true, this loyalty program primarily works through the retailer's own
   * app (the stored card number may only be a reference/backup). Drives an
   * informational banner and prioritizes the "Open app" action.
   */
  requires_app?: boolean;
  /** Official retailer app links (App Store / Play Store + optional deep-link schemes). */
  apps?: ShopAppLinks;
}

/**
 * A loyalty card stored by the user
 */
export interface LoyaltyCard {
  id: string;
  shopId: string;
  cardNumber: string;
  nickname?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Set when this card was shared with the current user by someone else and
   * accepted into their wallet. Shared cards are read-only (the recipient can
   * view/accept but not edit them). Only the email of who shared it is shown,
   * and only on the card detail screen.
   */
  sharedBy?: string;
}


/**
 * Premium sync status (placeholder for future backend integration)
 */
export interface SyncStatus {
  isPremium: boolean;
  lastSyncedAt?: string;
  syncEnabled: boolean;
}

/**
 * Navigation param types
 */
export type RootStackParamList = {
  Main: undefined;
  AddCard: { shopId?: string };
  CardDetails: { shopId: string; scannedCode?: string };
  EditCard: { cardId: string };
  CardDetail: { cardId: string };
  ScanBarcode: { shopId?: string };
  Import: undefined;
};


export type MainTabParamList = {
  Cards: undefined;
  Settings: undefined;
};
