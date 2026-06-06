import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import AuthNavigator from './AuthNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';
import BlockedStudentNavigator from './BlockedStudentNavigator';

const RootNavigator = () => {
  const { isLoading, userToken, userRole, financialStatus } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const isBlocked = financialStatus === 'Administrative Block';

  return (
    <NavigationContainer>
      {userToken == null ? (
        <AuthNavigator />
      ) : userRole === 'teacher' ? (
        <TeacherNavigator />
      ) : isBlocked ? (
        <BlockedStudentNavigator />
      ) : (
        <StudentNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
