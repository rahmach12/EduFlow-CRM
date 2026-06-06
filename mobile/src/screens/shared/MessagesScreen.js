import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';

const MessagesScreen = () => {
  const { theme, isRTL } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const response = await apiService.get('/messages');
      setThreads(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const textAlignStyle = { textAlign: isRTL ? 'right' : 'left' };
  const flexDirectionStyle = { flexDirection: isRTL ? 'row-reverse' : 'row' };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : threads.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucun message.</Text>
          </View>
        ) : (
          threads.map(thread => {
            const isSender = thread.sender_id === user?.id;
            const otherUser = isSender ? thread.receiver : thread.sender;
            const title = thread.class_id ? `Annonce: ${thread.subject}` : otherUser?.first_name + ' ' + otherUser?.last_name;
            
            return (
              <TouchableOpacity 
                key={thread.id} 
                style={[
                  styles.messageCard, 
                  flexDirectionStyle,
                  { 
                    backgroundColor: thread.is_unread ? theme.primaryLight : theme.card,
                    borderColor: theme.border 
                  }
                ]}
              >
                <View style={[styles.avatarBox, { backgroundColor: theme.secondaryLight, [isRTL ? 'marginLeft' : 'marginRight']: 16 }]}>
                  {thread.class_id ? (
                    <Ionicons name="megaphone" size={24} color={theme.secondary} />
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.secondary }]}>
                      {otherUser?.first_name?.charAt(0) || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.textContent}>
                  <View style={[styles.headerRow, flexDirectionStyle]}>
                    <Text style={[styles.title, { color: theme.text, ...textAlignStyle, fontWeight: thread.is_unread ? 'bold' : '600' }]} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={[styles.time, { color: theme.textMuted }]}>
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.subject, { color: theme.text, ...textAlignStyle }]} numberOfLines={1}>
                    {thread.subject}
                  </Text>
                  <Text style={[styles.bodyPreview, { color: theme.textMuted, ...textAlignStyle }]} numberOfLines={2}>
                    {thread.body}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]}>
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textContent: { flex: 1 },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 16, flex: 1 },
  time: { fontSize: 11, marginLeft: 8 },
  subject: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  bodyPreview: { fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default MessagesScreen;
