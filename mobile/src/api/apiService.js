import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Laravel backend's actual network IP address when testing on physical device/emulator
// e.g. 'http://192.168.1.xxx:8000/api' or 'http://10.0.2.2:8000/api' for Android emulator
const API_URL = 'http://192.168.100.175:8000/api'; 

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiService.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error getting token from AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiService;
