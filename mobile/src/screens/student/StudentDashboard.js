import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const stats = { average: '14.5', absences: 2 };
  const schedulePreview = [
    { time: '08:00', subject: 'Algorithmique', room: 'Salle 201', color: theme.primary },
    { time: '10:00', subject: 'Base de données', room: 'Labo 3', color: theme.secondary },
  ];

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: theme.primaryLight, shadowColor: theme.primary }]}>
          <View style={[styles.headerTop, flexDirectionStyle]}>
            <View>
              <Text style={[styles.greeting, { color: theme.primary, ...textAlignStyle }]}>{t('greeting')}</Text>
              <Text style={[styles.name, { color: theme.text, ...textAlignStyle }]}>{user?.first_name || 'Étudiant'} {user?.last_name || ''}</Text>
            </View>
            <View style={[styles.avatarContainer, { backgroundColor: theme.card, borderColor: theme.primary }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{user?.first_name?.charAt(0) || 'E'}</Text>
            </View>
          </View>
          <View style={[styles.classBadge, flexDirectionStyle, { backgroundColor: theme.card }]}>
            <Ionicons name="book" size={14} color={theme.primary} style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
            <Text style={[styles.classText, { color: theme.primary }]}>{user?.student?.classe?.name || 'Génie Logiciel'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, flexDirectionStyle]}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="bar-chart" size={24} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textMuted, ...textAlignStyle }]}>{t('average')}</Text>
            <Text style={[styles.statValue, { color: theme.text, ...textAlignStyle }]}>{stats.average}/20</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar" size={24} color={theme.danger} />
            <Text style={[styles.statLabel, { color: theme.textMuted, ...textAlignStyle }]}>{t('absences')}</Text>
            <Text style={[styles.statValue, { color: theme.text, ...textAlignStyle }]}>{stats.absences}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('quickActions')}</Text>
        </View>
        <View style={[styles.quickActionsRow, flexDirectionStyle]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Documents')}>
            <View style={[styles.iconBox, { backgroundColor: theme.secondaryLight }]}>
              <Ionicons name="document-text" size={24} color={theme.secondary} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>{t('documents')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.iconBox, { backgroundColor: theme.warningLight }]}>
              <Ionicons name="chatbubbles" size={24} color={theme.warning} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>{t('messages')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Finance')}>
            <View style={[styles.iconBox, { backgroundColor: theme.successLight }]}>
              <Ionicons name="wallet" size={24} color={theme.success} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>{t('finance')}</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('schedule')}</Text>
        </View>
        <View style={[styles.scheduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {schedulePreview.map((item, index) => (
            <View key={index} style={[styles.scheduleItem, flexDirectionStyle]}>
              <View style={[styles.timeLine, { backgroundColor: item.color, [isRTL ? 'marginLeft' : 'marginRight']: 12 }]} />
              <View style={[styles.scheduleContent, { backgroundColor: theme.background }]}>
                <Text style={[styles.scheduleTime, { color: theme.textMuted, ...textAlignStyle }]}>{item.time}</Text>
                <Text style={[styles.scheduleSubject, { color: theme.text, ...textAlignStyle }]}>{item.subject}</Text>
                <Text style={[styles.scheduleRoom, { color: theme.textMuted, ...textAlignStyle }]}>{item.room}</Text>
              </View>
            </View>
          ))}
        </View>

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
  headerCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  classBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  classText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionsRow: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  scheduleItem: {
    marginBottom: 16,
  },
  timeLine: {
    width: 4,
    borderRadius: 4,
  },
  scheduleContent: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  scheduleTime: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  scheduleSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  scheduleRoom: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default StudentDashboard;
