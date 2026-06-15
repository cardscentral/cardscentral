import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type ScanBarcodeRouteProp = RouteProp<RootStackParamList, 'ScanBarcode'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ScanBarcodeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScanBarcodeRouteProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    navigateWithResult(data);
  };

  const navigateWithResult = (code: string) => {
    navigation.navigate('AddCard', {
      shopId: route.params?.shopId,
      // @ts-ignore - extending params for passing scan result
      scannedCode: code,
    });
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setProcessing(true);
      const imageUri = result.assets[0].uri;

      // Use expo-camera's scanFromURLAsync to detect barcodes in the image
      const barcodes = await scanFromURLAsync(imageUri, [
        'ean13',
        'ean8',
        'code128',
        'code39',
        'qr',
        'pdf417',
        'aztec',
      ]);

      setProcessing(false);

      if (barcodes.length > 0) {
        navigateWithResult(barcodes[0].data);
      } else {
        Alert.alert(
          'No Barcode Found',
          'Could not detect a barcode in the selected image. Please try another image or use the camera.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container} testID="scan-screen">
        <Text style={styles.message}>Requesting camera permission...</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handlePickFromGallery}
          testID="pick-from-gallery-button"
        >
          <MaterialIcons name="photo-library" size={20} color="#FFFFFF" />
          <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container} testID="scan-screen">
        <Text style={styles.message}>
          Camera permission is required to scan barcodes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>— or —</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handlePickFromGallery}
          testID="pick-from-gallery-button"
        >
          <MaterialIcons name="photo-library" size={20} color="#FFFFFF" />
          <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="scan-screen">
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'code128',
            'code39',
            'qr',
            'pdf417',
            'aztec',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Scanning overlay */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructions}>
            Point your camera at the barcode on the loyalty card
          </Text>
        </View>
      </View>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        {scanned ? (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickFromGallery}
            testID="pick-from-gallery-button"
          >
            <MaterialIcons name="photo-library" size={20} color="#FFFFFF" />
            <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
          </TouchableOpacity>
        )}
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Scanning image...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  orText: {
    color: '#999',
    fontSize: 14,
    marginVertical: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanArea: {
    width: 280,
    height: 180,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  toolbar: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
  rescanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  rescanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});
