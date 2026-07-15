/**
 * Card Storage Service
 *
 * Manages loyalty cards in local AsyncStorage.
 */


import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoyaltyCard } from '../types';
import { storageKey } from './storageKey';

// Stage-namespaced so the QA deployment (/qa/) never touches production cards
// (/app/), which share the same web origin/localStorage.
const CARDS_STORAGE_KEY = storageKey('cards');


/**
 * Get all stored loyalty cards
 */
export async function getAllCards(): Promise<LoyaltyCard[]> {
  try {
    const json = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as LoyaltyCard[];
  } catch (error) {
    console.error('Failed to load cards:', error);
    return [];
  }
}

/**
 * Get a single card by ID
 */
export async function getCardById(id: string): Promise<LoyaltyCard | undefined> {
  const cards = await getAllCards();
  return cards.find((card) => card.id === id);
}

/**
 * Save a new loyalty card
 */
export async function addCard(card: LoyaltyCard): Promise<void> {
  const cards = await getAllCards();
  cards.push(card);
  await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Update an existing loyalty card
 */
export async function updateCard(updatedCard: LoyaltyCard): Promise<void> {
  const cards = await getAllCards();
  const index = cards.findIndex((card) => card.id === updatedCard.id);
  if (index === -1) {
    throw new Error(`Card with id ${updatedCard.id} not found`);
  }
  cards[index] = { ...updatedCard, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Delete a loyalty card
 */
export async function deleteCard(id: string): Promise<void> {
  const cards = await getAllCards();
  const filtered = cards.filter((card) => card.id !== id);
  await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Delete all cards (for testing/reset)
 */
export async function clearAllCards(): Promise<void> {
  await AsyncStorage.removeItem(CARDS_STORAGE_KEY);
}
