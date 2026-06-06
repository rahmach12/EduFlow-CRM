import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const FinanceScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { user, financialStatus } = useContext(AuthContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const activeFinance = user?.student?.student_finances?.find(f => f.is_active);
  const isBlocked = financialStatus === 'Administrative Block';

  const handleKonnectPayment = async () => {
    setLoading(true);
    try {
      // Create a payment session via backend API
      const response = await apiService.post('/konnect/init', {
        amount: activeFinance?.remaining_balance || 0,
        student_id: user.student.id,
        finance_id: activeFinance?.id
      });

      if (response.data && response.data.payUrl) {
        Alert.alert('Redirection', 'Vous allez être redirigé vers Konnect...');
        // In a real app we would open a WebBrowser here:
        // await WebBrowser.openBrowserAsync(response.data.payUrl);
      } else {
        throw new Error('Invalid payment URL');
      }
    } catch (e) {
      console.log('Payment error', e);
      Alert.alert('Erreur', 'Impossible d\'initialiser le paiement Konnect. Assurez-vous que l\'API est configurée.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container}>
        
        {isBlocked && (
          <View style={[styles.alertBox, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}>
            <Ionicons name="warning" size={24} color={theme.danger} />
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, { color: theme.danger }]}>{t('financeBlockTitle')}</Text>
              <Text style={[styles.alertMessage, { color: theme.danger }]}>{t('financeBlockMessage')}</Text>
            </View>
          </View>
        )}

        <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{t('outstandingBalance')}</Text>
          <Text style={[styles.balanceAmount, { color: theme.text }]}>
            {activeFinance?.remaining_balance || 0} TND
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.payButton, { backgroundColor: '#10b981' }]} 
          onPress={handleKonnectPayment}
          disabled={loading}
        >
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={styles.payButtonText}>{loading ? '...' : t('payWithKonnect')}</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('paymentHistory')}</Text>
        </View>
        
        <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucun paiement récent.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  alertBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: 8,
  },
  payButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  historyCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
});

export default FinanceScreen;
