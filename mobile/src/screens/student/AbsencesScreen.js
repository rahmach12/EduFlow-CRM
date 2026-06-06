import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const AbsencesScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAbsences = async () => {
    try {
      const response = await apiService.get('/attendance');
      // Filter only absences (present = false or similar logic depending on backend)
      // Assuming response.data returns records where type="absence" or similar
      setAbsences(response.data.filter(record => record.status === 'absent' || record.type === 'absence'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text, ...textAlignStyle }]}>{t('absences')}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, ...textAlignStyle }]}>Historique des absences</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : absences.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={theme.success} />
            <Text style={[styles.emptyText, { color: theme.success }]}>Aucune absence enregistrée !</Text>
          </View>
        ) : (
          absences.map((absence, index) => {
            const isJustified = absence.reason !== null && absence.reason !== '';
            const color = isJustified ? theme.success : theme.danger;
            const statusText = isJustified ? 'Justifiée' : 'Injustifiée';

            return (
              <View key={absence.id || index} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, flexDirectionStyle]}>
                  <Text style={[styles.subject, { color: theme.text, ...textAlignStyle }]}>{absence.subject?.name || 'Matière'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.statusText, { color: color }]}>{statusText}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={[styles.infoRow, flexDirectionStyle]}>
                    <Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                    <Text style={[styles.infoText, { color: theme.textMuted }]}>{new Date(absence.date || absence.created_at).toLocaleDateString()}</Text>
                  </View>
                  {absence.reason && (
                    <View style={[styles.infoRow, flexDirectionStyle, { marginTop: 4 }]}>
                      <Ionicons name="document-text-outline" size={16} color={theme.textMuted} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                      <Text style={[styles.infoText, { color: theme.textMuted }]}>{absence.reason}</Text>
                    </View>
                  )}
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subject: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { marginTop: 4 },
  infoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: { fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});

export default AbsencesScreen;
