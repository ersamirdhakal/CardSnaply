/**
 * Batch Review Screen
 * Allows editing and saving multiple contacts at once
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { localStorage } from '../utils/LocalStorage';
import * as Contacts from 'expo-contacts';

export default function BatchReviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const initialResults = route.params?.results || [];

  const [results, setResults] = useState(initialResults);

  const styles = createStyles(colors);

  const updateContact = (index, field, value) => {
    const updated = [...results];
    updated[index].contact[field] = value;
    setResults(updated);
  };

  const removeContact = (index) => {
    Alert.alert('Remove Contact', 'Remove this contact from batch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = results.filter((_, i) => i !== index);
          setResults(updated);
        },
      },
    ]);
  };

  const swapNameCompany = (index) => {
    const updated = [...results];
    const temp = updated[index].contact.name;
    updated[index].contact.name = updated[index].contact.company || '';
    updated[index].contact.company = temp || '';
    setResults(updated);
  };

  const handleSaveAll = async () => {
    const validContacts = results.filter(r => r.contact && r.contact.name);
    
    if (validContacts.length === 0) {
      Alert.alert('Error', 'No valid contacts to save');
      return;
    }

    try {
      // Save to local storage
      for (const result of validContacts) {
        await localStorage.saveContact(result.contact, result.imageUri);
      }

      // Ask if user wants to save to phone contacts
      Alert.alert(
        'Save to Phone Contacts?',
        `Save ${validContacts.length} contact(s) to your phone's address book?`,
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: 'Save',
            onPress: async () => {
              try {
                const { status } = await Contacts.requestPermissionsAsync();
                if (status === 'granted') {
                  for (const result of validContacts) {
                    const contact = result.contact;
                    const newContact = {
                      firstName: contact.name.split(' ')[0] || contact.name,
                      lastName: contact.name.split(' ').slice(1).join(' ') || '',
                      company: contact.company || '',
                      emails: contact.email ? [{ label: 'work', email: contact.email }] : [],
                      phoneNumbers: contact.phone ? [{ label: 'mobile', number: contact.phone }] : [],
                    };
                    await Contacts.addContactAsync(newContact);
                  }
                  Alert.alert('Success', 'Contacts saved to phone!');
                } else {
                  Alert.alert('Permission Denied', 'Contacts permission is required to save to phone.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to save to phone contacts: ' + error.message);
              }
            },
          },
        ]
      );

      Alert.alert('Success', `${validContacts.length} contact(s) saved!`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contacts: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Review Batch ({results.length} cards)
        </Text>

        {results.map((result, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              {result.imageUri && (
                <Image source={{ uri: result.imageUri }} style={styles.cardImage} />
              )}
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardNumber, { color: colors.textSecondary }]}>
                  Card {index + 1}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeContact(index)}
                >
                  <Text style={[styles.removeButtonText, { color: colors.danger }]}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldRow}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                    value={result.contact.name || ''}
                    onChangeText={(text) => updateContact(index, 'name', text)}
                    placeholder="Enter name"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.swapButton, { borderColor: colors.border }]}
                  onPress={() => swapNameCompany(index)}
                >
                  <Text style={[styles.swapButtonText, { color: colors.textSecondary }]}>⇄</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Company</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={result.contact.company || ''}
                  onChangeText={(text) => updateContact(index, 'company', text)}
                  placeholder="Enter company"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={result.contact.phone || ''}
                  onChangeText={(text) => updateContact(index, 'phone', text)}
                  placeholder="Enter phone"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={result.contact.email || ''}
                  onChangeText={(text) => updateContact(index, 'email', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Event Tag</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={result.contact.eventTag || ''}
                  onChangeText={(text) => updateContact(index, 'eventTag', text)}
                  placeholder="e.g., Edu Summit 2025"
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveAllButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveAll}
        >
          <Text style={styles.saveAllButtonText}>💾 Save All Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    card: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 12,
    },
    cardImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    cardHeaderText: {
      flex: 1,
      justifyContent: 'space-between',
    },
    cardNumber: {
      fontSize: 12,
    },
    removeButton: {
      alignSelf: 'flex-end',
    },
    removeButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    form: {
      gap: 12,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: 8,
    },
    field: {
      flex: 1,
    },
    swapButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    swapButtonText: {
      fontSize: 18,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
    },
    saveAllButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 12,
    },
    saveAllButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelButton: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

