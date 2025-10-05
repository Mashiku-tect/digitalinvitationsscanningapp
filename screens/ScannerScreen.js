import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const ScannerScreen = ({ route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [eventId, setEventId] = useState(null);

  // Get event ID from navigation params if available
  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
      //try to log event Id
     // console.log('Scanning for Event ID:', route.params.eventId);
    }
  }, [route.params]);

  // Request camera permission
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Send scan data to backend
  // Send scan data to backend
const sendScanDataToBackend = async (scannedData) => {
  setProcessing(true);
  try {
    const token = await AsyncStorage.getItem('authToken'); 

    let url;
    try {
      url = new URL(scannedData);
    } catch (e) {
      try {
        const parsedData = JSON.parse(scannedData);
        url = { searchParams: new URLSearchParams(parsedData) };
      } catch (jsonError) {
        throw new Error('Invalid QR code format');
      }
    }

    const searchParams = url.searchParams;
    const guestId = searchParams.get('guestId') || searchParams.get('guestid');
    const scannedEventId = searchParams.get('eventId') || searchParams.get('eventid');
    const qrToken = searchParams.get('token') || searchParams.get('qrToken');

    if (!guestId || !scannedEventId || !qrToken) {
      throw new Error('Missing required data in QR code');
    }

    if (String(eventId) !== String(scannedEventId)) {
      Alert.alert(
        "Validation Error",
        "This QR code is not valid for the current event.",
        [{ text: "OK", onPress: () => setScanned(false) }] // <-- reset here
      );
      return;
    }

    const response = await axios.post(
      `${config.BASE_URL}/api/events/validate-scan`,
      {
        guestId,
        eventId: scannedEventId,
        qrToken,
        scannedEventId: eventId 
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      Alert.alert(
        "Scan Validated Successfully ✅",
        `Guest: ${response.data.guestName || 'Unknown'}\nStatus: ${response.data.status || 'Valid'}`,
        [{ text: "OK", onPress: () => setScanned(false) }] // <-- reset only after user taps OK
      );
    } else {
      Alert.alert(
        "Validation Failed",
        response.data.message || "This QR code is not valid.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  } catch (error) {
    console.error('Error validating scan:', error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to validate QR code",
      [{ text: "OK", onPress: () => setScanned(false) }]
    );
  } finally {
    setProcessing(false);
    // ❌ removed setScanned(false) here
  }
};


  // Handle scanned QR/barcode
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || processing) return; // Prevent multiple scans
    
    setScanned(true);
    Alert.alert(
      "QR Code Detected",
      "Processing scan...",
      [],
      { cancelable: false }
    );
    
    // Send data to backend automatically
    sendScanDataToBackend(data);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera access is required to scan QR codes</Text>
        <Button 
          title="Grant Permission" 
          onPress={requestPermission} 
        />
        <Button 
          title="Open Settings" 
          onPress={() => Linking.openSettings()} 
          style={{ marginTop: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned || processing ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'upc_e', 'code39', 'ean13', 'ean8', 'code128']
        }}
      />

      {/* Scanner frame overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>Position QR code within frame</Text>
        
        {eventId && (
          <Text style={styles.eventText}>
            Scanning for Event ID: {eventId}
          </Text>
        )}
      </View>

      {processing && (
        <View style={styles.processingContainer}>
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={styles.processingText}>Validating QR code...</Text>
          </View>
        </View>
      )}

      {scanned && !processing && (
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
};

export default ScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scanText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  processingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  processingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});