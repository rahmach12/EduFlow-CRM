import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const GradesScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = async () => {
    try {
      const response = await apiService.get('/notes');
      setGrades(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  const getSubjectColor = (index) => {
    const colors = [theme.primary, theme.secondary, theme.success, theme.warning, theme.danger];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text, ...textAlignStyle }]}>{t('grades')}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, ...textAlignStyle }]}>Semestre 2</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : grades.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucune note disponible.</Text>
          </View>
        ) : (
          grades.map((grade, index) => {
            const color = getSubjectColor(index);
            return (
              <View key={grade.id} style={[styles.card, flexDirectionStyle, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20', [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                  <Ionicons name="ribbon" size={24} color={color} />
                </View>
                <View style={styles.infoContainer}>
                  <Text style={[styles.subject, { color: theme.text, ...textAlignStyle }]}>{grade.subject?.name || 'Matière'}</Text>
                  <Text style={[styles.details, { color: theme.textMuted, ...textAlignStyle }]}>{grade.type} • {new Date(grade.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.score, { color: color }]}>{grade.value}/20</Text>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: { flex: 1 },
  subject: { fontSize: 16, fontWeight: 'bold' },
  details: { fontSize: 12, marginTop: 4 },
  scoreContainer: { paddingLeft: 12 },
  score: { fontSize: 18, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});

export default GradesScreen;
