import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StudentDetailsScreen = () => {
  const [search, setSearch] = useState('');

  const students = [
    { id: 1, name: 'Alice Dupont', class: 'GL3', status: 'Présent', color: '#10b981' },
    { id: 2, name: 'Jean Martin', class: 'GL3', status: 'Absent', color: '#f43f5e' },
    { id: 3, name: 'Marie Curie', class: 'RSI2', status: 'Présent', color: '#10b981' },
    { id: 4, name: 'Paul Bernard', class: 'RSI2', status: 'Retard', color: '#f59e0b' },
  ];

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Annuaire Étudiants</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un étudiant..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {filteredStudents.map((student) => (
          <TouchableOpacity key={student.id} style={styles.studentCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.className}>{student.class}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: student.color + '20' }]}>
              <Text style={[styles.statusText, { color: student.color }]}>{student.status}</Text>
            </View>
          </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27272a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#334155',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  infoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  className: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StudentDetailsScreen;
