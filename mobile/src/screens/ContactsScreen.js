/**
 * Contacts Screen
 * Displays saved contacts with search and management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { localStorage } from '../utils/LocalStorage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { vCardHandler } from '../utils/VCardHandler';

export default function ContactsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    try {
      const allContacts = await localStorage.getAllContacts();
      setContacts(allContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      await loadContacts();
      return;
    }
    try {
      const results = await localStorage.searchContacts(query);
      setContacts(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await localStorage.deleteContact(id);
            await loadContacts();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete contact: ' + error.message);
          }
        },
      },
    ]);
  };

  const handleShare = async (contact) => {
    try {
      const vcardString = vCardHandler.generate(contact);
      const fileName = `${contact.name || 'contact'}.vcf`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, vcardString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share contact: ' + error.message);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Contacts',
      'Are you sure you want to delete ALL contacts? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await localStorage.clearAllContacts();
              await loadContacts();
              Alert.alert('Success', 'All contacts cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear contacts: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderContact = ({ item }) => (
    <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.contactHeader}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.contactImage} />
        ) : (
          <View style={[styles.contactImagePlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.contactImageText}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>{item.name || 'Unnamed'}</Text>
          {item.company && (
            <Text style={[styles.contactCompany, { color: colors.textSecondary }]}>
              {item.company}
            </Text>
          )}
          {item.eventTag && (
            <Text style={[styles.contactTag, { color: colors.primary }]}>
              🏷️ {item.eventTag}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.contactDetails}>
        {item.phone && (
          <Text style={[styles.contactDetail, { color: colors.text }]}>
            📞 {item.phone}
          </Text>
        )}
        {item.email && (
          <Text style={[styles.contactDetail, { color: colors.text }]}>
            ✉️ {item.email}
          </Text>
        )}
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleShare(item)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
          placeholder="Search contacts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {contacts.length > 0 && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.danger }]}
            onPress={handleClearAll}
          >
            <Text style={[styles.clearButtonText, { color: colors.danger }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try a different search' : 'Start scanning business cards!'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      padding: 16,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    clearButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
    },
    contactCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    contactHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    contactImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    contactImagePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactImageText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    contactCompany: {
      fontSize: 14,
      marginBottom: 2,
    },
    contactTag: {
      fontSize: 12,
      marginTop: 4,
    },
    contactDetails: {
      marginTop: 8,
      gap: 4,
    },
    contactDetail: {
      fontSize: 14,
    },
    contactActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
    },
  });

