import { useState, useEffect } from 'react';

interface AlertConfig {
  id: string;
  itemType: 'line' | 'stop';
  itemId: string;
  itemName: string;
  enabled: boolean;
  advanceTimes: number[];
  afterDepartureTimes: number[];
  recurringTimes: string[];
  stopDirections?: ('ida' | 'volta')[];
  selectedLines?: Array<{
    lineId: string;
    lineName: string;
    directions: ('ida' | 'volta')[];
  }>;
  alertAllLines?: boolean;
}

export const useAlerts = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Verificar suporte a notificações e service worker
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão de notificação
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notificações não suportadas neste navegador');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    if (permission !== 'denied') {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      return newPermission === 'granted';
    }

    return false;
  };

  // Agendar notificações usando Service Worker
  const scheduleNotifications = async (config: AlertConfig): Promise<boolean> => {
    console.log('Agendando notificações para:', config);
    
    if (!config.enabled || !isSupported) {
      console.log('Config desabilitada ou não suportada');
      return false;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log('Permissão negada');
      return false;
    }

    try {
      // Aguardar service worker estar pronto
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker pronto:', registration);

      // Salvar configuração no localStorage para o service worker acessar
      const alertKey = `borabuz-alert-${config.itemType}-${config.itemId}`;
      localStorage.setItem(alertKey, JSON.stringify(config));

      // Agendar notificações para cada horário
      const now = new Date();
      const scheduledNotifications: Array<{
        time: string;
        delay: number;
        type: 'advance' | 'after';
        minutes: number;
      }> = [];

      config.recurringTimes.forEach(time => {
        // Notificações de antecedência
        config.advanceTimes.forEach(advanceMinutes => {
          const [hours, minutes] = time.split(':').map(Number);
          const notificationTime = new Date();
          notificationTime.setHours(hours, minutes - advanceMinutes, 0, 0);

          // Se já passou hoje, agendar para amanhã
          if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }

          const delay = notificationTime.getTime() - now.getTime();
          if (delay > 0) {
            scheduledNotifications.push({
              time,
              delay,
              type: 'advance',
              minutes: advanceMinutes
            });
          }
        });

        // Notificações após início
        config.afterDepartureTimes.forEach(afterMinutes => {
          const [hours, minutes] = time.split(':').map(Number);
          const notificationTime = new Date();
          notificationTime.setHours(hours, minutes + afterMinutes, 0, 0);

          if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }

          const delay = notificationTime.getTime() - now.getTime();
          if (delay > 0) {
            scheduledNotifications.push({
              time,
              delay,
              type: 'after',
              minutes: afterMinutes
            });
          }
        });
      });

      console.log('Notificações agendadas:', scheduledNotifications);

      // Enviar dados para o service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATIONS',
          config,
          notifications: scheduledNotifications
        });
        console.log('Mensagem enviada para SW');
        return true;
      } else {
        console.log('Service Worker não ativo');
        return false;
      }
    } catch (error) {
      console.error('Erro ao agendar notificações:', error);
      return false;
    }
  };

  // Cancelar notificações
  const cancelNotifications = async (itemType: string, itemId: string): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.active) {
        registration.active.postMessage({
          type: 'CANCEL_NOTIFICATIONS',
          itemType,
          itemId
        });
      }

      // Remover do localStorage
      const alertKey = `borabuz-alert-${itemType}-${itemId}`;
      localStorage.removeItem(alertKey);
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  };

  // Enviar notificação de teste
  const sendTestNotification = async (title: string, body: string): Promise<boolean> => {
    console.log('Enviando notificação de teste');
    
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log('Sem permissão para teste');
      return false;
    }

    try {
      // Tentar com Web Notifications API primeiro (funciona mesmo sem SW)
      if (Notification.permission === 'granted') {
        new Notification(`🚌 ${title}`, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'borabuz-test',
          requireInteraction: false
        });
        console.log('Notificação de teste enviada via Web API');
        return true;
      }

      // Fallback para service worker
      const registration = await navigator.serviceWorker.ready;
      if (registration?.active) {
        registration.active.postMessage({
          type: 'SEND_TEST_NOTIFICATION',
          title,
          body
        });
        console.log('Notificação de teste enviada via SW');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    scheduleNotifications,
    cancelNotifications,
    sendTestNotification
  };
};