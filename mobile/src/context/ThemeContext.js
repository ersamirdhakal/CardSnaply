/**
 * App Theme Context
 * Manages dark/light mode with persistence
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@CardSnaply:theme';

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme(systemTheme || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setTheme(systemTheme || 'light');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = {
    light: {
      background: '#FFFFFF',
      card: '#F8F9FA',
      text: '#1A1A1A',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      primary: '#2563EB',
      primaryDark: '#1D4ED8',
      success: '#10B981',
      danger: '#EF4444',
      input: '#FFFFFF',
    },
    dark: {
      background: '#111827',
      card: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      border: '#374151',
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      success: '#10B981',
      danger: '#EF4444',
      input: '#374151',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: colors[theme], isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

