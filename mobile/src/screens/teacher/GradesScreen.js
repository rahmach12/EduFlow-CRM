import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GradesScreen = () => {
  const actions = [
    { title: 'Saisir des notes', desc: 'Ajouter une nouvelle évaluation', icon: 'create', color: '#c084fc' },
    { title: 'Notes par Classe', desc: 'Consulter les moyennes', icon: 'podium', color: '#60a5fa' },
    { title: 'Bulletins', desc: 'Générer les relevés', icon: 'document-text', color: '#34d399' },
  ];

  const recentGrades = [
    { subject: 'Algorithmique - Examen', class: 'GL3', average: '13.5/20', date: 'Aujourd\'hui' },
    { subject: 'Réseaux - TP', class: 'RSI2', average: '15.2/20', date: 'Hier' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Notes</Text>
          <Text style={styles.subtitle}>Semestre 2</Text>
        </View>

        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionCard}>
              <View style={[styles.iconBox, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Dernières saisies</Text>
        
        {recentGrades.map((grade, index) => (
          <View key={index} style={styles.gradeCard}>
            <View style={styles.gradeInfo}>
              <Text style={styles.gradeSubject}>{grade.subject}</Text>
              <Text style={styles.gradeDetails}>{grade.class} • {grade.date}</Text>
            </View>
            <View style={styles.averageBox}>
              <Text style={styles.averageLabel}>Moyenne</Text>
              <Text style={styles.averageValue}>{grade.average}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27272a',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  actionsGrid: {
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  actionDesc: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27272a',
    marginBottom: 16,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  gradeDetails: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 4,
  },
  averageBox: {
    alignItems: 'flex-end',
  },
  averageLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  averageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginTop: 2,
  },
});

export default GradesScreen;
