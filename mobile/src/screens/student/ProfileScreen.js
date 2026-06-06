import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();

  const student = user?.student;
  const classe = student?.classe;

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  const InfoRow = ({ icon, label, value, color, bgColor }) => (
    <View style={[styles.infoRow, flexDirectionStyle]}>
      <View style={[styles.iconBox, { backgroundColor: bgColor || theme.card, [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
        <Ionicons name={icon} size={20} color={color || theme.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: theme.textMuted, ...textAlignStyle }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text, ...textAlignStyle }]}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primaryLight, borderColor: theme.card }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{user?.first_name?.charAt(0) || 'E'}</Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{user?.first_name} {user?.last_name}</Text>
          <Text style={[styles.role, { color: theme.textMuted }]}>{t('student')}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('personalInfo')}</Text>
          
          <InfoRow icon="mail" label={t('email')} value={user?.email} color={theme.secondary} bgColor={theme.secondaryLight} />
          <InfoRow icon="call" label={t('phone')} value={student?.phone} color={theme.success} bgColor={theme.successLight} />
          <InfoRow icon="location" label={t('address')} value={student?.address} color={theme.warning} bgColor={theme.warningLight} />
          <InfoRow icon="card" label={t('cin')} value={user?.cin} color={theme.primary} bgColor={theme.primaryLight} />
          <InfoRow icon="barcode" label={t('matricule')} value={student?.matricule} color={theme.secondary} bgColor={theme.secondaryLight} />
          <InfoRow icon="calendar" label={t('dob')} value={student?.date_of_birth} color={theme.danger} bgColor={theme.dangerLight} />
          <InfoRow icon="person" label={t('gender')} value={user?.gender} color={theme.success} bgColor={theme.successLight} />
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('level')}</Text>
          
          <InfoRow icon="school" label={t('class')} value={classe?.name} color={theme.primary} bgColor={theme.primaryLight} />
          <InfoRow icon="ribbon" label={t('level')} value={classe?.academic_level?.name} color={theme.warning} bgColor={theme.warningLight} />
          <InfoRow icon="git-network" label={t('filiere')} value={classe?.filiere?.name} color={theme.secondary} bgColor={theme.secondaryLight} />
        </View>

        <TouchableOpacity style={[styles.logoutButton, flexDirectionStyle, { backgroundColor: theme.dangerLight }]} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={theme.danger} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>{t('logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 16,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
