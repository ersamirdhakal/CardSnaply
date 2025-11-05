/**
 * Main App Entry Point
 * CardSnaply - Offline Business Card Scanner
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/context/ThemeContext';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import BatchReviewScreen from './src/screens/BatchReviewScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2563EB',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'CardSnaply',
              headerSubtitle: 'Snap. Scan. Save.',
            }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{
              title: 'Scan Card',
            }}
          />
          <Stack.Screen
            name="BatchReview"
            component={BatchReviewScreen}
            options={{
              title: 'Review Batch',
            }}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsScreen}
            options={{
              title: 'My Contacts',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

