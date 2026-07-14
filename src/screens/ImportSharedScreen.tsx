import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getShopById } from '../config/shops';
import { getAllCards, addCard } from '../storage/cardStorage';
import { generateId } from '../utils/generateId';
import { decodeAnyPayload } from '../utils/cardShare';
import { ShopIcon } from '../components/ShopIcon';
import { useI18n } from '../i18n/I18nContext';


type ImportSharedRouteProp = RouteProp<RootStackParamList, 'ImportShared'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ImportShared'>;

/**
 * Landing screen for a shared-card link (`…/#import=<payload>`).
 *
 * Decodes the payload, shows a preview, and — on confirm — adds the card to the
 * local wallet. Duplicates (same shop + card number) are detected so importing
 * the same link twice doesn't create clutter. Cards that carry a `sharedBy`
 * value are stored as read-only shared cards (see CardDetailScreen).
 */
export function ImportSharedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ImportSharedRouteProp>();
  const { t } = useI18n();
  const { payload } = route.params;

  // Supports both single-card (v1) and multi-card (v2) links.
  const decoded = useMemo(() => decodeAnyPayload(payload), [payload]);

  const [busy, setBusy] = useState(false);
  // Once import runs we show how many were added and how many were skipped as
  // duplicates. Null means the user hasn't imported yet.
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  // Invalid / unsupported link.
  if (!decoded || decoded.cards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.invalid} testID="import-shared-invalid">
          {t('addSharedInvalid')}
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()}
          testID="import-shared-back"
        >
          <Text style={styles.secondaryButtonText}>{t('importDone')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Keep only cards whose shop this build knows about; unknown shops can't be
  // rendered or usefully stored, so we drop them from the preview/import.
  const importable = decoded.cards.filter((c) => !!getShopById(c.shopId));

  const handleAdd = async () => {
    setBusy(true);
    try {
      const existing = await getAllCards();
      const seen = new Set(existing.map((c) => `${c.shopId}\u0000${c.cardNumber}`));
      let added = 0;
      let skipped = 0;
      for (const c of importable) {
        const key = `${c.shopId}\u0000${c.cardNumber}`;
        if (seen.has(key)) {
          skipped += 1;
          continue;
        }
        seen.add(key);
        const now = new Date().toISOString();
        const card: LoyaltyCard = {
          id: generateId(),
          shopId: c.shopId,
          cardNumber: c.cardNumber,
          nickname: c.nickname,
          notes: c.notes,
          createdAt: now,
          updatedAt: now,
          ...(decoded.sharedBy ? { sharedBy: decoded.sharedBy } : {}),
        };
        await addCard(card);
        added += 1;
      }
      setResult({ added, skipped });
    } finally {
      setBusy(false);
    }
  };

  const multiple = importable.length > 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="import-shared-screen"
    >
      <Text style={styles.title} testID="import-shared-title">{t('addSharedTitle')}</Text>
      <Text style={styles.description}>
        {multiple
          ? t('addSharedDescriptionMany').replace('{count}', String(importable.length))
          : t('addSharedDescription')}
      </Text>

      {decoded.sharedBy ? (
        <View style={styles.sharedByBanner}>
          <Text style={styles.sharedByText}>
            {t('sharedByLabel')}: {decoded.sharedBy}
          </Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {importable.map((c, i) => {
          const shop = getShopById(c.shopId)!;
          return (
            <View style={styles.listRow} key={`${c.shopId}-${c.cardNumber}-${i}`} testID="import-shared-row">
              <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={40} />
              <View style={styles.listText}>
                <Text style={styles.listShop} numberOfLines={1}>{shop.name}</Text>
                <Text style={styles.listNumber} numberOfLines={1}>
                  {c.nickname ? `${c.nickname} · ` : ''}{c.cardNumber}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {result === null ? (
        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={busy}
          testID="import-shared-add"
        >
          <Text style={styles.buttonText}>
            {multiple
              ? t('addSharedButtonMany').replace('{count}', String(importable.length))
              : t('addSharedButton')}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[styles.result, styles.resultSuccess]} testID="import-shared-success">
            {t('addSharedResult')
              .replace('{added}', String(result.added))
              .replace('{skipped}', String(result.skipped))}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.popToTop()}
            testID="import-shared-done"
          >
            <Text style={styles.buttonText}>{t('importDone')}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  sharedByBanner: {
    backgroundColor: '#EAF3FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B9D8FF',
    marginBottom: 16,
  },
  sharedByText: {
    color: '#0A5BBF',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  listText: {
    flex: 1,
  },
  listShop: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listNumber: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  button: {

    marginTop: 20,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  result: {
    marginTop: 20,
    fontSize: 15,
    textAlign: 'center',
  },
  resultSuccess: {
    color: '#34C759',
    fontWeight: '600',
  },
  resultWarn: {
    color: '#8A5A00',
    fontWeight: '600',
  },
  invalid: {
    marginTop: 48,
    marginHorizontal: 24,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
