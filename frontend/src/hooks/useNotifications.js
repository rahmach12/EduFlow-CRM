import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContextObject';

export function useNotifications() {
  return useContext(NotificationContext);
}
