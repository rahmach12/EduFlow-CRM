import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

import StudentDashboard from '../screens/student/StudentDashboard';
import ProfileScreen from '../screens/student/ProfileScreen';
import GradesScreen from '../screens/student/GradesScreen';
import AbsencesScreen from '../screens/student/AbsencesScreen';
import DocumentRequestScreen from '../screens/student/DocumentRequestScreen';
import FinanceScreen from '../screens/student/FinanceScreen';
import MessagesScreen from '../screens/shared/MessagesScreen'; // we will create this

const Tab = createBottomTabNavigator();

const StudentNavigator = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.primaryLight,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.primary,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Grades') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Absences') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Documents') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Finance') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} options={{ title: t('home') }} />
      <Tab.Screen name="Grades" component={GradesScreen} options={{ title: t('grades') }} />
      <Tab.Screen name="Absences" component={AbsencesScreen} options={{ title: t('absences') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
      
      {/* Hidden from tab bar but accessible via navigation */}
      <Tab.Screen name="Documents" component={DocumentRequestScreen} options={{ title: t('documents'), tabBarButton: () => null }} />
      <Tab.Screen name="Finance" component={FinanceScreen} options={{ title: t('finance'), tabBarButton: () => null }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: t('messages'), tabBarButton: () => null }} />
    </Tab.Navigator>
  );
};

export default StudentNavigator;
