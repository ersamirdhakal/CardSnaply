/**
 * Home Screen
 * Main entry point with scan options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const styles = createStyles(colors);

  const handleSingleScan = () => {
    navigation.navigate('Camera', { mode: 'single' });
  };

  const handleBatchScan = () => {
    navigation.navigate('Camera', { mode: 'batch' });
  };

  const handleViewContacts = () => {
    navigation.navigate('Contacts');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📇 CardSnaply</Text>
        <Text style={styles.tagline}>Snap. Scan. Save.</Text>
        <Text style={styles.description}>
          100% Offline • OCR • QR Codes • Private
        </Text>
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleSingleScan}
        >
          <Text style={styles.primaryButtonText}>📸 Scan Single Card</Text>
          <Text style={styles.buttonSubtext}>Take photo or import image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.primary }]}
          onPress={handleBatchScan}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            📚 Batch Scan Mode
          </Text>
          <Text style={styles.buttonSubtext}>Process multiple cards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.textSecondary }]}
          onPress={handleViewContacts}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            👥 My Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.themeToggle, { borderColor: colors.border }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.themeToggleText, { color: colors.text }]}>
          {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Text>
      </TouchableOpacity>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          All processing happens offline on your device.
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Your data stays private.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 18,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actionsContainer: {
      width: '100%',
      gap: 16,
      marginBottom: 32,
    },
    primaryButton: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    secondaryButton: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    themeToggle: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 32,
    },
    themeToggleText: {
      fontSize: 14,
      fontWeight: '500',
    },
    footer: {
      alignItems: 'center',
      marginTop: 'auto',
      paddingBottom: 20,
    },
    footerText: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
    },
  });

