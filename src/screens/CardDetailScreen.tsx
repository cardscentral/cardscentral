import React, { useEffect, useState } from 'react';
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

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoyaltyCard, RootStackParamList } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCardById, deleteCard } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { ShopIcon } from '../components/ShopIcon';
import { BarcodeDisplay } from '../components/BarcodeDisplay';
import {
  hasShopApp,
  openShopApp,
  openUrl,
  getAppStoreUrl,
  getPlayStoreUrl,
} from '../utils/openShopApp';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { buildShareUrl } from '../utils/cardShare';


type CardDetailRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CardDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CardDetailRouteProp>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cardId } = route.params;


  // The stack header is transparent and floats over this screen, so the card
  // header must reserve room for it (safe-area top inset + the header bar
  // height) to keep the shop logo from being clipped behind the back button.
  const headerBarHeight = Platform.OS === 'ios' ? 44 : 56;
  const headerClearance = insets.top + headerBarHeight;


  const [card, setCard] = useState<LoyaltyCard | undefined>();
  // Set while a delete is in flight so the screen stops rendering the card's
  // barcode/details. Without this, deleting then calling navigation.goBack()
  // can race the back-transition: the still-mounted detail screen re-renders
  // with stale state and intermittently crashes the app on iOS.
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    const loaded = await getCardById(cardId);
    setCard(loaded);
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      await deleteCard(cardId);
    } finally {
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    const title = 'Delete Card';
    const body = 'Are you sure you want to delete this card? This cannot be undone.';

    // On web, React Native's multi-button Alert.alert is not backed by a real
    // dialog, so the "Delete" button callback never fires (the action appears
    // to do nothing). Use the browser's native confirm() there instead.
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`${title}\n\n${body}`)
          : true;
      if (confirmed) void performDelete();
      return;
    }

    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
    ]);
  };


  if (deleting || !card) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      </View>
    );
  }

  const shop = getShopById(card.shopId);
  if (!shop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Shop not found</Text>
      </View>
    );
  }


  // On web (PWA) we can't detect or deep-link installed apps, so we never show
  // the "app available" affordance there — hasShopApp() already returns false.
  const isWeb = Platform.OS === 'web';
  const appAvailable = hasShopApp(shop);
  // Single platform-appropriate store button: App Store on iOS, Google Play on
  // Android. On web there's no single "current" store, so prefer whichever
  // listing the shop declares (Play Store first, then App Store).
  const storeUrl = isWeb
    ? getPlayStoreUrl(shop) ?? getAppStoreUrl(shop)
    : Platform.OS === 'ios'
      ? getAppStoreUrl(shop)
      : getPlayStoreUrl(shop);
  // Button label: "Open" when we can deep-link the native app, "View in store"
  // on web (the store listing opens as a normal web page), else "Install".
  const storeButtonLabel = appAvailable
    ? t('openApp')
    : isWeb
      ? t('viewInStore')
      : t('installApp');

  const handleStoreButton = async () => {
    // If the app is known, try to deep-link into it (falls back to the store);
    // otherwise just open the store listing so the user can install it.
    const ok = appAvailable ? await openShopApp(shop) : await openUrl(storeUrl!);
    if (!ok) Alert.alert(shop.name, t('couldNotOpenApp'));
  };

  // Share this single card as a self-contained link. On native we use the OS
  // share sheet; on web, prefer the Web Share API and fall back to copying the
  // link to the clipboard so it works in every browser.
  const handleShare = async () => {
    if (!card) return;
    const url = buildShareUrl(card);
    const message = `${t('shareCardMessage')} ${shop.name}`;
    try {
      if (isWeb) {
        const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.share) {
          await nav.share({ title: shop.name, text: message, url });
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(url);
          Alert.alert(shop.name, t('linkCopied'));
          return;
        }
        // Last resort: surface the link so the user can copy it manually.
        Alert.alert(shop.name, url);
        return;
      }
      await Share.share({ message: `${message}\n${url}`, url });
    } catch {
      Alert.alert(shop.name, t('shareFailed'));
    }
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} testID="card-detail-screen">

      {/* Card Header with Shop Branding */}
      <View
        style={[
          styles.cardHeader,
          { backgroundColor: shop.brand.primary_color, paddingTop: headerClearance + 16 },
        ]}
      >

        <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={64} hasApp={appAvailable} />

        <Text style={[styles.shopName, { color: shop.brand.text_color }]}>
          {shop.name}
        </Text>
        {card.nickname && (
          <Text style={[styles.nickname, { color: shop.brand.text_color }]}>
            {card.nickname}
          </Text>
        )}
      </View>

      {/* Barcode Section */}
      <View style={[styles.barcodeSection, { backgroundColor: colors.card }]}>

        <BarcodeDisplay
          value={card.cardNumber}
          type={shop.barcode_type}
          width={300}
          height={120}
        />
      </View>

      {/* Official app section — shown only when the shop declares a VERIFIED
          store link (see openShopApp.ts / scripts/verify-app-links.js); the
          whole block is gated on `storeUrl`. A single platform button
          (App Store on iOS, Google Play on Android): it reads "Open app" and
          deep-links when we know the shop has a native app, otherwise it reads

          "Install app" and opens the store listing. The info banner only
          shows when a known native app exists for this shop. */}

      {storeUrl && (
        <View style={styles.appSection} testID="shop-app-section">
          {appAvailable && (
            <View
              style={[
                styles.appBanner,
                shop.requires_app ? styles.appBannerRequired : styles.appBannerAvailable,
              ]}
            >
              <MaterialCommunityIcons
                name={shop.requires_app ? 'cellphone-check' : 'cellphone-cog'}
                size={20}
                color={shop.requires_app ? '#8A5A00' : '#0A5BBF'}
              />
              <Text
                style={[
                  styles.appBannerText,
                  shop.requires_app ? styles.appBannerTextRequired : styles.appBannerTextAvailable,
                ]}
              >
                {shop.requires_app ? t('appRequiredBanner') : t('appAvailableBanner')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.storeButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={handleStoreButton}
            testID="open-store-button"
          >
            <MaterialCommunityIcons
              name={Platform.OS === 'ios' ? 'apple' : 'google-play'}
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.storeButtonText, { color: colors.primary }]}>

              {storeButtonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card Info */}
      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Card Number</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{card.cardNumber}</Text>
        </View>
        {card.nickname && (
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Nickname</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{card.nickname}</Text>
          </View>
        )}
        {card.notes && (
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Notes</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{card.notes}</Text>
          </View>
        )}
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Added</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(card.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {card.sharedBy && (
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Shared by</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} testID="shared-by-value">
              {card.sharedBy}
            </Text>
          </View>
        )}
      </View>


      {/* Actions */}
      {card.sharedBy ? (
        // Shared cards are read-only: no edit. Users can still remove the copy
        // from their own wallet, but cannot modify a card someone shared.
        <View style={styles.actions} testID="shared-card-actions">
          <View style={styles.sharedBanner}>
            <Text style={styles.sharedBannerText}>
              This card was shared with you and is read-only.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            testID="share-card-button"
          >
            <MaterialCommunityIcons name="share-variant" size={18} color="#007AFF" />
            <Text style={styles.shareButtonText}>{t('shareCard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="remove-shared-card-button"
          >
            <Text style={styles.deleteButtonText}>Remove from My Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            testID="share-card-button"
          >
            <MaterialCommunityIcons name="share-variant" size={18} color="#007AFF" />
            <Text style={styles.shareButtonText}>{t('shareCard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditCard', { cardId: card.id })}
            testID="edit-card-button"
          >
            <Text style={styles.editButtonText}>Edit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="delete-card-button"
          >
            <Text style={styles.deleteButtonText}>Delete Card</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 32,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#666',
  },
  cardHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  nickname: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  barcodeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appSection: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  appBannerRequired: {
    backgroundColor: '#FFF7E6',
    borderColor: '#F5D08A',
  },
  appBannerAvailable: {
    backgroundColor: '#EAF3FF',
    borderColor: '#B9D8FF',
  },
  appBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  appBannerTextRequired: {
    color: '#8A5A00',
  },
  appBannerTextAvailable: {
    color: '#0A5BBF',
  },
  openAppButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  openAppButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  storeButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  actions: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  sharedBanner: {
    backgroundColor: '#EAF3FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B9D8FF',
  },
  sharedBannerText: {
    color: '#0A5BBF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
