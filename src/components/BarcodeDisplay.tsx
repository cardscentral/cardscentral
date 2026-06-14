/**
 * BarcodeDisplay Component
 *
 * Renders a barcode or QR code based on the shop's configured barcode_type.
 * Uses SVG rendering for barcodes and a simple visual representation.
 *
 * In production, you'd use a library like react-native-barcode-builder or
 * JsBarcode for accurate barcode rendering. This provides a visual placeholder
 * that shows the card number with the appropriate format indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarcodeType } from '../types';

interface BarcodeDisplayProps {
  value: string;
  type: BarcodeType;
  width?: number;
  height?: number;
}

export function BarcodeDisplay({ value, type, width = 280, height = 100 }: BarcodeDisplayProps) {
  if (type === 'qr') {
    return (
      <View style={[styles.qrContainer, { width: width * 0.6, height: width * 0.6 }]}>
        <View style={styles.qrInner}>
          <View style={styles.qrPattern}>
            {/* Simplified QR visual - corners */}
            <View style={[styles.qrCorner, styles.qrTopLeft]} />
            <View style={[styles.qrCorner, styles.qrTopRight]} />
            <View style={[styles.qrCorner, styles.qrBottomLeft]} />
          </View>
          <Text style={styles.qrText} numberOfLines={2} adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
        <Text style={styles.typeLabel}>QR Code</Text>
      </View>
    );
  }

  // Barcode types (EAN-13, EAN-8, Code128, Code39, etc.)
  return (
    <View style={[styles.barcodeContainer, { width, height }]}>
      <View style={styles.barcodeLines}>
        {/* Generate visual barcode lines */}
        {Array.from({ length: 40 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.barcodeLine,
              {
                width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1,
                backgroundColor: i % 4 === 3 ? 'transparent' : '#000',
                height: height * 0.7,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.barcodeNumber}>{value}</Text>
      <Text style={styles.typeLabel}>{getBarcodeLabel(type)}</Text>
    </View>
  );
}

function getBarcodeLabel(type: BarcodeType): string {
  switch (type) {
    case 'ean13':
      return 'EAN-13';
    case 'ean8':
      return 'EAN-8';
    case 'code128':
      return 'Code 128';
    case 'code39':
      return 'Code 39';
    case 'pdf417':
      return 'PDF417';
    case 'aztec':
      return 'Aztec';
    case 'qr':
      return 'QR Code';
    default:
      return 'Barcode';
  }
}

const styles = StyleSheet.create({
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  barcodeLine: {
    borderRadius: 0,
  },
  barcodeNumber: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#000',
    letterSpacing: 2,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  qrInner: {
    flex: 1,
    width: '100%',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  qrPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#000',
    borderWidth: 3,
  },
  qrTopLeft: {
    top: 4,
    left: 4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrTopRight: {
    top: 4,
    right: 4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  qrBottomLeft: {
    bottom: 4,
    left: 4,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  qrText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
    textAlign: 'center',
  },
  typeLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});
