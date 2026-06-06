import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const NotificationsScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await apiService.get('/notifications');
      setNotifications(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // A more advanced implementation would use Pusher/Echo here for real-time updates
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiService.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucune nouvelle notification.</Text>
          </View>
        ) : (
          notifications.map(notification => (
            <TouchableOpacity 
              key={notification.id} 
              style={[
                styles.notificationCard, 
                flexDirectionStyle,
                { 
                  backgroundColor: notification.is_read ? theme.background : theme.primaryLight,
                  borderColor: theme.border 
                }
              ]}
              onPress={() => !notification.is_read && markAsRead(notification.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.card, [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                <Ionicons name={notification.type === 'finance' ? 'wallet' : 'notifications'} size={24} color={theme.primary} />
              </View>
              <View style={styles.textContent}>
                <Text style={[styles.title, { color: theme.text, ...textAlignStyle, fontWeight: notification.is_read ? '600' : 'bold' }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.message, { color: theme.textMuted, ...textAlignStyle }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.time, { color: theme.textMuted, ...textAlignStyle }]}>
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  notificationCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: { flex: 1 },
  title: { fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, marginBottom: 8 },
  time: { fontSize: 11 },
});

export default NotificationsScreen;
