import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoyaltyCard } from '../types';
import { getAllCards } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { ShopIcon } from '../components/ShopIcon';
import { hasShopApp } from '../utils/openShopApp';
import { buildCardsShareUrl, SharedCard } from '../utils/cardShare';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';

/**
 * Select cards and produce a single shareable link that contains all of them.
 *
 * This doubles as a lightweight backup/restore: the generated link encodes the
 * selected cards (shop id + number + optional nickname/notes) with no server
 * involved. Users can send it over any channel (Viber, email, notes to self, …)
 * and re-import later or on another device. It is a point-in-time copy, not
 * live sync.
 *
 * The list intentionally mirrors the main Cards list layout (same card rows,
 * shop icon, name + number) so it feels familiar — the only addition is a
 * selection checkbox on each row.
 */
export function ShareCardsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCards().then((c) => {
      setCards(c);
      // Default to everything selected — the common case is "back up all".
      const all: Record<string, boolean> = {};
      c.forEach((card) => {
        all[card.id] = true;
      });
      setSelected(all);
      setLoading(false);
    });
  }, []);

  const selectedCount = useMemo(
    () => cards.filter((c) => selected[c.id]).length,
    [cards, selected]
  );
  const allSelected = cards.length > 0 && selectedCount === cards.length;

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    cards.forEach((c) => {
      next[c.id] = !allSelected;
    });
    setSelected(next);
  };

  const handleShare = async () => {
    const chosen: SharedCard[] = cards
      .filter((c) => selected[c.id])
      .map((c) => ({
        shopId: c.shopId,
        cardNumber: c.cardNumber,
        nickname: c.nickname,
        notes: c.notes,
      }));

    if (chosen.length === 0) return;

    const url = buildCardsShareUrl(chosen);
    const message = t('shareCardsMessage').replace('{count}', String(chosen.length));

    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.share) {
          await nav.share({ title: t('shareCardsTitle'), text: message, url });
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(url);
          Alert.alert(t('shareCardsTitle'), t('linkCopied'));
          return;
        }
        Alert.alert(t('shareCardsTitle'), url);
        return;
      }
      await Share.share({ message: `${message}\n${url}`, url });
    } catch {
      Alert.alert(t('shareCardsTitle'), t('shareFailed'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textMuted }]}>…</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textMuted }]} testID="share-cards-empty">
          {t('shareCardsEmpty')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="share-cards-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {t('shareCardsDescription')}
        </Text>

        <TouchableOpacity style={styles.selectAllRow} onPress={toggleAll} testID="share-select-all">
          <MaterialCommunityIcons
            name={allSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.selectAllText, { color: colors.primary }]}>{t('selectAll')}</Text>
        </TouchableOpacity>

        <View style={styles.list}>
          {cards.map((card) => {
            const shop = getShopById(card.shopId);
            const isSel = !!selected[card.id];
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: colors.card,
                    borderLeftColor: shop ? shop.brand.primary_color : colors.border,
                  },
                ]}
                onPress={() => toggle(card.id)}
                activeOpacity={0.7}
                testID="share-card-row"
              >
                <MaterialCommunityIcons
                  name={isSel ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={isSel ? colors.primary : colors.textMuted}
                />
                {shop ? (
                  <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={48} hasApp={hasShopApp(shop)} />
                ) : null}
                <View style={styles.info}>
                  <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>
                    {shop ? shop.name : card.shopId}
                  </Text>
                  <Text style={[styles.cardNumber, { color: colors.textMuted }]} numberOfLines={1}>
                    {card.nickname || card.cardNumber}
                  </Text>
                  {card.nickname ? (
                    <Text style={[styles.cardNumberSmall, { color: colors.textMuted }]} numberOfLines={1}>
                      {card.cardNumber}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, selectedCount === 0 && styles.buttonDisabled]}
          onPress={handleShare}
          disabled={selectedCount === 0}
          testID="share-cards-button"
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={colors.onPrimary} />
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {t('shareSelected').replace('{count}', String(selectedCount))}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 4,
    marginHorizontal: 16,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  list: {},
  // Mirrors the main Cards list item (CardListItem) with an added checkbox.
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cardNumberSmall: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#F5F5F7',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});
