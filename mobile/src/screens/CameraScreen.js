/**
 * Camera Screen
 * Handles photo capture and image import using expo-camera
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { contactParser } from '../utils/ContactParser';
import { vCardHandler } from '../utils/VCardHandler';
import { localStorage } from '../utils/LocalStorage';
import { ocrProcessor } from '../utils/OCRProcessor';

export default function CameraScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || 'single';

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [contact, setContact] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [eventTag, setEventTag] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [scanned, setScanned] = useState(false); // Track if QR code was scanned

  const cameraRef = useRef(null);

  const styles = createStyles(colors);

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPreviewUri(photo.uri);
      setImageUri(photo.uri);
      await processImage(photo.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image: ' + error.message);
    }
  };

  const processImage = async (uri) => {
    setProcessing(true);
    try {
      // Extract text using OCR
      const extractedContact = await ocrProcessor.processImage(uri);
      
      setContact(extractedContact);
      
      // If no text was extracted, show a helpful message
      if (!extractedContact.name && !extractedContact.email && !extractedContact.phone) {
        // Don't show alert - just let user enter manually
        // The form will be shown with empty fields
      }
    } catch (error) {
      console.error('Processing error:', error);
      // Set empty contact so user can enter manually
      setContact({
        name: '',
        phone: '',
        email: '',
        company: '',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setImageUri(null);
    setContact(null);
    setScanned(false); // Reset QR scan state
  };

  /**
   * Handle QR code scanning using expo-camera's built-in barcode scanner
   * Automatically detects and parses vCard QR codes
   */
  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return; // Prevent multiple scans

    setScanned(true);
    
    try {
      // Check if it's a vCard (starts with BEGIN:VCARD)
      if (data && data.trim().startsWith('BEGIN:VCARD')) {
        // Parse vCard directly
        const parsedContact = vCardHandler.parse(data);
        setContact(parsedContact);
        Alert.alert('Success', 'vCard detected and parsed!', [
          {
            text: 'OK',
            onPress: () => {
              // No image for QR codes, but we have contact data
              setImageUri(null);
            },
          },
        ]);
      } else if (data && data.includes('@')) {
        // Might be a contact card or email - try to extract basic info
        const emailMatch = data.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) {
          setContact({
            name: '',
            email: emailMatch[1],
            phone: '',
            company: '',
          });
          Alert.alert('QR Code Detected', 'Email found in QR code');
        }
      } else {
        // Generic QR code - show data
        Alert.alert('QR Code Detected', `Data: ${data.substring(0, 100)}`, [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]);
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert('Error', 'Failed to parse QR code: ' + error.message);
      setScanned(false);
    }
  };

  const handleSave = async () => {
    if (!contact || !contact.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      const contactToSave = {
        ...contact,
        eventTag: eventTag.trim(),
      };

      if (mode === 'batch') {
        setBatchResults([...batchResults, { contact: contactToSave, imageUri }]);
        Alert.alert('Success', 'Contact added to batch. Continue scanning or review batch.');
        // Reset for next scan
        handleRetake();
      } else {
        await localStorage.saveContact(contactToSave, imageUri);
        Alert.alert('Success', 'Contact saved!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact: ' + error.message);
    }
  };

  const handleReviewBatch = () => {
    if (batchResults.length === 0) {
      Alert.alert('Info', 'No contacts in batch');
      return;
    }
    navigation.navigate('BatchReview', { results: batchResults });
  };

  // Permission loading state
  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.text, marginTop: 20 }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Camera permission is required
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show contact form when image is captured and contact is extracted
  if (imageUri && contact) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
        
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={contact.name}
            onChangeText={(text) => setContact({ ...contact, name: text })}
            placeholder="Enter name"
          />

          <Text style={[styles.label, { color: colors.text }]}>Company</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={contact.company}
            onChangeText={(text) => setContact({ ...contact, company: text })}
            placeholder="Enter company"
          />

          <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={contact.phone}
            onChangeText={(text) => setContact({ ...contact, phone: text })}
            placeholder="Enter phone"
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={contact.email}
            onChangeText={(text) => setContact({ ...contact, email: text })}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>Event Tag</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={eventTag}
            onChangeText={setEventTag}
            placeholder="e.g., Edu Summit 2025"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Contact</Text>
            )}
          </TouchableOpacity>

          {mode === 'batch' && batchResults.length > 0 && (
            <TouchableOpacity
              style={[styles.reviewButton, { borderColor: colors.primary }]}
              onPress={handleReviewBatch}
            >
              <Text style={[styles.reviewButtonText, { color: colors.primary }]}>
                📋 Review Batch ({batchResults.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Main camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'], // Support QR codes and PDF417 (common for business cards)
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      
      {/* Preview overlay with retake button */}
      {previewUri && (
        <View style={styles.previewOverlay}>
          <Image source={{ uri: previewUri }} style={styles.previewThumbnail} />
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: colors.card }]}
            onPress={handleRetake}
          >
            <Text style={[styles.smallButtonText, { color: colors.text }]}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera controls overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
        >
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: colors.primary }]}
          onPress={takePhoto}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Scan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={handleImagePicker}
        >
          <Text style={styles.buttonText}>📁</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    content: {
      padding: 20,
    },
    camera: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlay: {
      position: 'absolute',
      bottom: 40,
      width: '100%',
      alignItems: 'center',
      gap: 12,
    },
    captureButton: {
      backgroundColor: '#2563EB',
      padding: 16,
      borderRadius: 999,
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    smallButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 10,
      borderRadius: 999,
      minWidth: 60,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    smallButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    previewOverlay: {
      position: 'absolute',
      top: 60,
      right: 20,
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 8,
      borderRadius: 12,
      gap: 8,
    },
    previewThumbnail: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    previewImage: {
      width: '100%',
      height: 300,
      borderRadius: 12,
      marginBottom: 20,
    },
    form: {
      gap: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    saveButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    reviewButton: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      marginTop: 8,
    },
    reviewButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
  });

