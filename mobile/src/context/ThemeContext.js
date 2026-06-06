import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../locales/i18n';

export const ThemeContext = createContext();

// Define our Pastel Light Theme and Dark Theme
export const lightTheme = {
  isDark: false,
  background: '#fafafa', // Light gray/white
  card: '#ffffff',
  text: '#27272a',
  textMuted: '#a1a1aa',
  border: '#f4f4f5',
  primary: '#c084fc', // Pastel purple
  primaryLight: '#f3e8ff',
  secondary: '#60a5fa', // Pastel blue
  secondaryLight: '#e0f2fe',
  success: '#34d399', // Pastel green
  successLight: '#dcfce7',
  danger: '#fb7185', // Pastel rose
  dangerLight: '#ffe4e6',
  warning: '#fbbf24', // Pastel amber
  warningLight: '#fef3c7',
};

export const darkTheme = {
  isDark: true,
  background: '#121212', // Deep dark
  card: '#1e1e24',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  border: '#27272a',
  primary: '#a855f7', // Slightly deeper for contrast
  primaryLight: '#3b0764',
  secondary: '#3b82f6', 
  secondaryLight: '#1e3a8a',
  success: '#10b981', 
  successLight: '#064e3b',
  danger: '#f43f5e',
  dangerLight: '#881337',
  warning: '#f59e0b',
  warningLight: '#78350f',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [currentTheme, setCurrentTheme] = useState(lightTheme);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    // Update active theme based on mode
    if (themeMode === 'system') {
      setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    } else if (themeMode === 'dark') {
      setCurrentTheme(darkTheme);
    } else {
      setCurrentTheme(lightTheme);
    }
  }, [themeMode, systemColorScheme]);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
      
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        checkRTL(savedLanguage);
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  };

  const checkRTL = (langCode) => {
    const shouldBeRTL = langCode === 'ar';
    if (shouldBeRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      // App restart is typically required for RTL change to take effect perfectly
      // But we set state to update what we can dynamically
      setIsRTL(shouldBeRTL);
    }
  };

  const changeTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('language', lang);
    checkRTL(lang);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      themeMode, 
      changeTheme,
      language: i18n.language,
      changeLanguage,
      isRTL
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
