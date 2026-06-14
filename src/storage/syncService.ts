/**
 * Sync Service (Premium Feature - Placeholder)
 *
 * This module prepares for future backend synchronization.
 * When implemented, premium users will be able to:
 * - Sync cards across multiple devices
 * - Share cards with other users
 * - Backup cards to the cloud
 *
 * Currently, all data is stored locally only.
 */

import { LoyaltyCard, SyncStatus } from '../types';

const DEFAULT_SYNC_STATUS: SyncStatus = {
  isPremium: false,
  lastSyncedAt: undefined,
  syncEnabled: false,
};

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  // TODO: Implement premium check via backend API
  return DEFAULT_SYNC_STATUS;
}

/**
 * Check if user has premium access
 */
export function isPremiumUser(): boolean {
  // TODO: Implement premium verification
  return false;
}

/**
 * Sync cards to backend (premium only)
 */
export async function syncCards(_cards: LoyaltyCard[]): Promise<void> {
  if (!isPremiumUser()) {
    throw new Error('Premium subscription required for cloud sync');
  }
  // TODO: Implement API call to sync cards
  // POST /api/v1/cards/sync
  throw new Error('Sync not yet implemented');
}

/**
 * Fetch cards from backend (premium only)
 */
export async function fetchRemoteCards(): Promise<LoyaltyCard[]> {
  if (!isPremiumUser()) {
    throw new Error('Premium subscription required for cloud sync');
  }
  // TODO: Implement API call to fetch cards
  // GET /api/v1/cards
  throw new Error('Sync not yet implemented');
}

/**
 * Share a card with another user (premium only)
 */
export async function shareCard(_cardId: string, _targetUserId: string): Promise<void> {
  if (!isPremiumUser()) {
    throw new Error('Premium subscription required for card sharing');
  }
  // TODO: Implement card sharing API
  // POST /api/v1/cards/:cardId/share
  throw new Error('Sharing not yet implemented');
}
