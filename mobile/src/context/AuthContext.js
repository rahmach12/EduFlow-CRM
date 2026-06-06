import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [user, setUser] = useState(null);
  const [financialStatus, setFinancialStatus] = useState('Paid'); // Default to Paid

  const checkUserStatus = (userData) => {
    if (userData?.role?.name === 'Student') {
      const activeFinance = userData.student?.student_finances?.find(f => f.is_active);
      if (activeFinance) {
        setFinancialStatus(activeFinance.financial_status);
      } else {
        setFinancialStatus('Paid'); // If no record, assume clear
      }
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      
      if (token) {
        // Validate token and get user data
        const response = await apiService.get('/me');
        const userData = response.data;
        
        setUserToken(token);
        setUser(userData);
        setUserRole(userData.role.name.toLowerCase() === 'teacher' ? 'teacher' : 'student');
        checkUserStatus(userData);
      }
    } catch (e) {
      console.log(`isLoggedIn error:`, e);
      // If unauthorized, clear token
      if (e.response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      const roleStr = userData.role.name.toLowerCase() === 'teacher' ? 'teacher' : 'student';

      setUserToken(access_token);
      setUser(userData);
      setUserRole(roleStr);
      checkUserStatus(userData);

      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('userRole', roleStr);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.post('/logout');
    } catch(e) {
      // Ignore if token is already expired
    }
    setUserToken(null);
    setUserRole(null);
    setUser(null);
    setFinancialStatus('Paid');
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userRole, user, financialStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
