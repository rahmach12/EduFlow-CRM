import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  const stats = { classes: 4, students: 120 };
  const schedulePreview = [
    { time: '08:00', subject: 'Algorithmique', room: 'Salle 201', class: 'GL3', color: '#60a5fa' },
    { time: '14:00', subject: 'Architecture', room: 'Amphi B', class: 'RSI2', color: '#818cf8' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.name}>Prof. {user?.last_name || 'Enseignant'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out" size={20} color="#0369a1" />
            </TouchableOpacity>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={14} color="#0369a1" />
            <Text style={styles.roleText}>Département Informatique</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
            <Ionicons name="people" size={24} color="#0284c7" />
            <Text style={styles.statLabel}>Mes Classes</Text>
            <Text style={[styles.statValue, { color: '#0369a1' }]}>{stats.classes}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
            <Ionicons name="person" size={24} color="#4f46e5" />
            <Text style={styles.statLabel}>Étudiants</Text>
            <Text style={[styles.statValue, { color: '#3730a3' }]}>{stats.students}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
        </View>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>
              <Ionicons name="create" size={24} color="#c084fc" />
            </View>
            <Text style={styles.actionText}>Saisir Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconBox, { backgroundColor: '#fff1f2' }]}>
              <Ionicons name="checkmark-done" size={24} color="#fb7185" />
            </View>
            <Text style={styles.actionText}>Appel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="folder-open" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>Ressources</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cours d'aujourd'hui</Text>
        </View>
        <View style={styles.scheduleCard}>
          {schedulePreview.map((item, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={[styles.timeLine, { backgroundColor: item.color }]} />
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                  <View style={styles.classBadgeSm}>
                    <Text style={styles.classBadgeText}>{item.class}</Text>
                  </View>
                </View>
                <Text style={styles.scheduleSubject}>{item.subject}</Text>
                <Text style={styles.scheduleRoom}>{item.room}</Text>
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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0369a1',
    marginTop: 2,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bae6fd',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  statsRow: {
    flexDirection: 'row',
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
    color: '#71717a',
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
    color: '#27272a',
  },
  quickActionsRow: {
    flexDirection: 'row',
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
    color: '#52525b',
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeLine: {
    width: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  scheduleContent: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: 'bold',
  },
  classBadgeSm: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  scheduleSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#27272a',
    marginTop: 4,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
});

export default TeacherDashboard;
