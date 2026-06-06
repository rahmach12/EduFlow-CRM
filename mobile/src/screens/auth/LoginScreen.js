import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch, I18nManager } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
// We don't import Expo.Updates directly, we'll prompt the user to restart if RTL changes.

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const { theme, themeMode, changeTheme, language, changeLanguage, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Veuillez saisir votre email et mot de passe.');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error(error);
      Alert.alert('Échec de connexion', 'Identifiants incorrects ou erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    changeTheme(theme.isDark ? 'light' : 'dark');
  };

  const cycleLanguage = () => {
    const langs = ['fr', 'en', 'ar'];
    const currentIndex = langs.indexOf(language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    changeLanguage(nextLang);
    
    if ((nextLang === 'ar' && !I18nManager.isRTL) || (nextLang !== 'ar' && I18nManager.isRTL)) {
      Alert.alert('Redémarrage requis', 'Pour appliquer le changement de direction (RTL/LTR), veuillez redémarrer l\'application.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Bar for Settings */}
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.card }]} onPress={cycleLanguage}>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.card }]} onPress={toggleTheme}>
          <Ionicons name={theme.isDark ? 'moon' : 'sunny'} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="school" size={64} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>EduFlow CRM</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t('welcome')}</Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('email')}
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder="Mot de passe"
          placeholderTextColor={theme.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
