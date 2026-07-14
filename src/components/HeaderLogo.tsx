/**
 * HeaderLogo
 *
 * Branded header title for the main Cards screen: the app icon next to the
 * "Cards Central" wordmark. Used as the `headerTitle` of the Cards tab in place
 * of the plain localized "My Cards" text.
 *
 * "Cards Central" is the product/brand name, so it is intentionally NOT
 * translated — it renders identically in every locale (like a shop brand name).
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// The app launcher icon doubles as the in-app brand mark.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('../../assets/icon.png');

export function HeaderLogo() {
  const { colors } = useTheme();
  return (
    <View style={styles.container} testID="header-logo">
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        Cards Central
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
