import React, { useState } from 'react';
import {
  Text,
  StyleSheet,

  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { addCard } from '../storage/cardStorage';
import { parseVoucherVaultExport } from '../storage/voucherVaultImport';
import { useI18n } from '../i18n/I18nContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Import'>;

/**
 * One-time import of loyalty cards from a VoucherVault export.
 *
 * VoucherVault (open-source, self-hosted) can export all vouchers as JSON
 * (Account → Export Data). The user pastes that JSON here; we parse it locally
 * and add each voucher as a card. Pasting is the primary, fully E2E-testable
 * path — a native file picker can't be reliably driven by Maestro in CI, so it
 * is offered only as an optional convenience and degrades gracefully when
 * `expo-document-picker` isn't installed.
 *
 * Closed apps such as Klarna expose no public export/import API, so they can't
 * be integrated directly; their cards can be brought in via any tool that
 * produces a compatible JSON export.
 */
export function ImportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const runImport = async () => {
    setBusy(true);
    setResult(null);
    setHasError(false);

    const parsed = parseVoucherVaultExport(text);

    if (parsed.cards.length === 0) {
      setHasError(true);
      setResult(parsed.errors[0] || t('importEmpty'));
      setBusy(false);
      return;
    }

    for (const card of parsed.cards) {
      await addCard(card);
    }

    const extra = parsed.skipped > 0 ? ` (${parsed.skipped})` : '';
    setHasError(false);
    setResult(`${parsed.imported}${extra}`);
    setBusy(false);
  };

  /**
   * Optional convenience: pick the export file instead of pasting. Uses a
   * dynamic import so the app still builds/runs when expo-document-picker isn't
   * installed (we don't want to add a native dependency just for this).
   */
  const pickFile = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DocumentPicker = require('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      const asset = res?.assets?.[0];
      if (!asset?.uri) return;
      const content = await fetch(asset.uri).then((r) => r.text());
      setText(content);
    } catch {
      // Picker unavailable (module not installed) — paste path still works.
      setHasError(true);
      setResult(t('importPlaceholder'));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="import-screen"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} testID="import-title">{t('importTitle')}</Text>
      <Text style={styles.description}>{t('importDescription')}</Text>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={t('importPlaceholder')}
        placeholderTextColor="#999"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        testID="import-input"
      />

      <TouchableOpacity style={styles.secondaryButton} onPress={pickFile} testID="import-pick-file">
        <Text style={styles.secondaryButtonText}>{t('importPickFile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={runImport}
        disabled={busy}
        testID="import-button"
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t('importButton')}</Text>
        )}
      </TouchableOpacity>

      {result !== null && (
        <Text
          style={[styles.result, hasError ? styles.resultError : styles.resultSuccess]}
          testID={hasError ? 'import-error' : 'import-success'}
        >
          {result}
        </Text>
      )}

      {result !== null && !hasError && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.popToTop()}
          testID="import-done"
        >
          <Text style={styles.doneButtonText}>{t('importDone')}</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
  },
  input: {
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#1a1a1a',
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  button: {
    marginTop: 4,
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
  result: {
    marginTop: 20,
    fontSize: 15,
    textAlign: 'center',
  },
  resultSuccess: {
    color: '#34C759',
    fontWeight: '600',
  },
  resultError: {
    color: '#FF3B30',
  },
  doneButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
