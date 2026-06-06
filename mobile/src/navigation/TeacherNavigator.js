import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import ClassListScreen from '../screens/teacher/ClassListScreen';
import StudentDetailsScreen from '../screens/teacher/StudentDetailsScreen';
import GradesScreen from '../screens/teacher/GradesScreen';

const Tab = createBottomTabNavigator();

const TeacherNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#e0f2fe', // pastel blue
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#bae6fd',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#0369a1',
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f4f4f5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Classes') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Students') iconName = focused ? 'school' : 'school-outline';
          else if (route.name === 'Grades') iconName = focused ? 'ribbon' : 'ribbon-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboard} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Classes" component={ClassListScreen} options={{ title: 'Classes' }} />
      <Tab.Screen name="Students" component={StudentDetailsScreen} options={{ title: 'Étudiants' }} />
      <Tab.Screen name="Grades" component={GradesScreen} options={{ title: 'Évaluations' }} />
    </Tab.Navigator>
  );
};

export default TeacherNavigator;
