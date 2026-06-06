import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ClassListScreen = () => {
  const classes = [
    { name: 'Génie Logiciel 3', code: 'GL3', students: 32, type: 'Amphi', color: '#60a5fa' },
    { name: 'Réseaux & Systèmes', code: 'RSI2', students: 28, type: 'TP', color: '#818cf8' },
    { name: 'Intelligence Artificielle', code: 'IA1', students: 25, type: 'TD', color: '#34d399' },
    { name: 'Sécurité Informatique', code: 'SEC4', students: 35, type: 'Amphi', color: '#fbbf24' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Mes Classes</Text>
          <Text style={styles.subtitle}>Semestre 2</Text>
        </View>

        <View style={styles.gridContainer}>
          {classes.map((cls, index) => (
            <TouchableOpacity key={index} style={styles.classCard}>
              <View style={[styles.cardTop, { backgroundColor: cls.color + '15' }]}>
                <View style={styles.codeBadge}>
                  <Text style={[styles.codeText, { color: cls.color }]}>{cls.code}</Text>
                </View>
                <Ionicons name="people-circle" size={32} color={cls.color} />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.className} numberOfLines={1}>{cls.name}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={12} color="#a1a1aa" />
                  <Text style={styles.infoText}>{cls.students} étudiants</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag" size={12} color="#a1a1aa" />
                  <Text style={styles.infoText}>{cls.type}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
    marginBottom: 20,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  cardTop: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  codeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBottom: {
    padding: 16,
    paddingTop: 12,
  },
  className: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3f3f46',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#71717a',
  },
});

export default ClassListScreen;
