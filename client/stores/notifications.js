import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useNotificationsStore = defineStore('notificationsStore', () => {
  const notifications = ref([]);

  const addNotification = ({type = 'info', text, title, timeout}) => {
    if (!timeout) {
      switch (type) {
        case 'info':
          timeout = 3000;
          break;
        case 'error':
          timeout = 5000;
          break;
      }
    }

    const notification = {
      id: Math.random().toString(36).substring(2, 8),
      type,
      title,
      text,
      timeout
    };

    notifications.value.push(notification);
  }

  const removeNotification = (notificationId) => {
    notifications.value = notifications.value.filter((notification) => notification.id !== notificationId)
  }

  const removeAllNotifications = () => {
    notifications.value = [];
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    removeAllNotifications,
  }
});
