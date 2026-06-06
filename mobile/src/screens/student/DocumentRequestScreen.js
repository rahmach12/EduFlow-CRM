import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const DocumentRequestScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const documentTypes = [
    { id: 'attestation_inscription', label: 'Attestation d\'Inscription', icon: 'document-text' },
    { id: 'attestation_presence', label: 'Attestation de Présence', icon: 'checkmark-circle' },
    { id: 'releve_notes', label: 'Relevé de Notes', icon: 'bar-chart' },
    { id: 'convention_stage', label: 'Convention de Stage', icon: 'briefcase' },
    { id: 'stage_papers', label: 'Documents de Stage', icon: 'folder-open' }
  ];

  const fetchRequests = async () => {
    try {
      const response = await apiService.get('/document-requests');
      setRequests(response.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de charger vos demandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (docType) => {
    Alert.alert(
      t('newRequest'),
      `Voulez-vous vraiment demander ce document ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiService.post('/document-requests', { document_type: docType });
              Alert.alert('Succès', t('requestSent'));
              fetchRequests();
            } catch (e) {
              Alert.alert('Erreur', 'Échec de l\'envoi de la demande.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return theme.success;
      case 'approved': return theme.primary;
      case 'rejected': return theme.danger;
      default: return theme.warning;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'ready': return t('ready');
      case 'approved': return 'Approuvé';
      case 'rejected': return t('rejected');
      default: return t('pending');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('newRequest')}</Text>
        </View>

        <View style={styles.grid}>
          {documentTypes.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={[styles.docCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleRequest(doc.id)}
              disabled={submitting}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={doc.icon} size={24} color={theme.primary} />
              </View>
              <Text style={[styles.docLabel, { color: theme.text }]}>{doc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, ...textAlignStyle }]}>{t('documentRequests')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucune demande en cours.</Text>
          </View>
        ) : (
          requests.map((req) => {
            const docInfo = documentTypes.find(d => d.id === req.document_type) || { label: req.document_type, icon: 'document' };
            const statusColor = getStatusColor(req.status);
            
            return (
              <View key={req.id} style={[styles.requestCard, flexDirectionStyle, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.reqIcon, { backgroundColor: theme.secondaryLight, [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                  <Ionicons name={docInfo.icon} size={24} color={theme.secondary} />
                </View>
                <View style={styles.reqInfo}>
                  <Text style={[styles.reqType, { color: theme.text, ...textAlignStyle }]}>{docInfo.label}</Text>
                  <Text style={[styles.reqDate, { color: theme.textMuted, ...textAlignStyle }]}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(req.status)}</Text>
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
  contentContainer: { padding: 20 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  docCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  reqIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqInfo: { flex: 1 },
  reqType: { fontSize: 15, fontWeight: 'bold' },
  reqDate: { fontSize: 12, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, fontSize: 14 },
});

export default DocumentRequestScreen;
