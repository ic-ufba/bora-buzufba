// Service Worker para notificações em background
const CACHE_NAME = 'borabuz-v1';
const DB_NAME = 'BoraBuzDB';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Armazenar timeouts ativos (para compatibilidade)
let activeTimeouts = new Map();
let db = null;

// Inicializar IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }
    };
  });
}

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('SW: Cache opened');
          return cache.addAll(urlsToCache);
        })
        .catch((error) => {
          console.error('SW: Cache failed:', error);
        }),
      initDB()
    ])
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      initDB().then(() => {
        // Verificar notificações pendentes ao ativar
        checkPendingNotifications();
        // Configurar verificação periódica
        setInterval(checkPendingNotifications, 30000); // Verificar a cada 30 segundos
      })
    ])
  );
  self.clients.claim();
  console.log('SW: Activated');
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições do Vite dev server e desenvolvimento
  const url = new URL(event.request.url);
  
  // Ignorar requisições do Vite dev server
  if (url.pathname.startsWith('/@vite/') || 
      url.pathname.startsWith('/@react-refresh') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.includes('?t=') ||
      url.pathname.includes('hot-update') ||
      url.protocol === 'chrome-extension:' ||
      url.protocol === 'moz-extension:') {
    return;
  }
  
  // Só interceptar requisições HTTP/HTTPS do mesmo origin
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.log('SW: Erro no fetch, retornando requisição original:', error);
        return fetch(event.request);
      })
  );
});

// Lidar com mensagens do app principal
self.addEventListener('message', (event) => {
  console.log('SW: Mensagem recebida:', event.data);
  const { type, config, notifications, itemType, itemId, title, body } = event.data;

  switch (type) {
    case 'SCHEDULE_NOTIFICATIONS':
      console.log('SW: Agendando notificações');
      scheduleNotificationsDB(config, notifications);
      break;
    
    case 'CANCEL_NOTIFICATIONS':
      console.log('SW: Cancelando notificações');
      cancelNotificationsDB(itemType, itemId);
      break;
    
    case 'SEND_TEST_NOTIFICATION':
      console.log('SW: Enviando notificação de teste');
      sendTestNotification(title, body);
      break;
  }
});

// Nova função para agendar notificações usando IndexedDB
async function scheduleNotificationsDB(config, notifications) {
  console.log('SW: scheduleNotificationsDB chamada', { config, notifications });
  
  if (!db) {
    await initDB();
  }
  
  // Cancelar notificações anteriores para este item
  await cancelNotificationsDB(config.itemType, config.itemId);

  if (!config.enabled) {
    console.log('SW: Config desabilitada, não agendando');
    return;
  }

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  const now = Date.now();

  for (const notification of notifications) {
    const scheduledTime = now + notification.delay;
    const notificationData = {
      id: `${config.itemType}-${config.itemId}-${notification.time}-${notification.type}-${notification.minutes}`,
      config,
      notification,
      scheduledTime,
      processed: false
    };
    
    console.log('SW: Salvando notificação no DB:', notificationData);
    store.add(notificationData);
  }
  
  await transaction.complete;
  console.log('SW: Notificações salvas no IndexedDB');
  
  // Verificar imediatamente se alguma notificação deve ser enviada
  setTimeout(() => checkPendingNotifications(), 1000);
}

// Nova função para cancelar notificações usando IndexedDB
async function cancelNotificationsDB(itemType, itemId) {
  if (!db) {
    await initDB();
  }
  
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();
  
  request.onsuccess = () => {
    const notifications = request.result;
    const toDelete = notifications.filter(n => 
      n.config.itemType === itemType && n.config.itemId === itemId
    );
    
    console.log(`SW: Removendo ${toDelete.length} notificações do DB para ${itemType}-${itemId}`);
    
    toDelete.forEach(n => {
      store.delete(n.id);
    });
  };
  
  await transaction.complete;
  
  // Também cancelar timeouts ativos (compatibilidade)
  const key = `${itemType}-${itemId}`;
  const timeouts = activeTimeouts.get(key);
  if (timeouts) {
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    activeTimeouts.delete(key);
  }
}

// Função para verificar notificações pendentes
async function checkPendingNotifications() {
  if (!db) {
    return;
  }
  
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const notifications = request.result;
      const now = Date.now();
      
      const pendingNotifications = notifications.filter(n => 
        !n.processed && n.scheduledTime <= now
      );
      
      console.log(`SW: Verificando notificações - ${pendingNotifications.length} pendentes`);
      
      pendingNotifications.forEach(async (notificationData) => {
        console.log('SW: Processando notificação:', notificationData);
        
        const message = generateNotificationMessage(notificationData.config, notificationData.notification);
        
        await showNotification(message.title, {
          body: message.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `borabuz-${notificationData.config.itemType}-${notificationData.config.itemId}-${notificationData.notification.time}`,
          requireInteraction: true,
          data: {
            itemType: notificationData.config.itemType,
            itemId: notificationData.config.itemId,
            itemName: notificationData.config.itemName,
            time: notificationData.notification.time
          },
          actions: [
            {
              action: 'open',
              title: 'Abrir App',
              icon: '/favicon.ico'
            },
            {
              action: 'dismiss',
              title: 'Dispensar',
              icon: '/favicon.ico'
            }
          ]
        });
        
        // Marcar como processada
        notificationData.processed = true;
        store.put(notificationData);
      });
    };
    
    await transaction.complete;
  } catch (error) {
    console.error('SW: Erro ao verificar notificações pendentes:', error);
  }
}

// Função para agendar notificações (mantida para compatibilidade)
function scheduleNotifications(config, notifications) {
  console.log('SW: scheduleNotifications (legacy) redirecionando para DB');
  scheduleNotificationsDB(config, notifications);
}

// Função para cancelar notificações (mantida para compatibilidade)
function cancelNotifications(itemType, itemId) {
  console.log('SW: cancelNotifications (legacy) redirecionando para DB');
  cancelNotificationsDB(itemType, itemId);
}

// Função para enviar notificação de teste
function sendTestNotification(title, body) {
  console.log('SW: Enviando notificação de teste:', { title, body });
  showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'borabuz-test',
    requireInteraction: false,
    data: { test: true }
  });
}

// Função para mostrar notificação
function showNotification(title, options) {
  console.log('SW: Mostrando notificação:', { title, options });
  return self.registration.showNotification(`🚌 ${title}`, options)
    .then(() => {
      console.log('SW: Notificação mostrada com sucesso');
    })
    .catch((error) => {
      console.error('SW: Erro ao mostrar notificação:', error);
    });
}

// Função para gerar mensagem de notificação
function generateNotificationMessage(config, notification) {
  const { time, type, minutes } = notification;
  
  if (config.itemType === 'line') {
    const title = `Linha ${config.itemName}`;
    let body;
    
    if (type === 'advance') {
      if (minutes === 0) {
        body = `Saída agora às ${time}`;
      } else {
        body = `Saída em ${minutes} minutos (${time})`;
      }
    } else {
      body = `Saída iniciada há ${minutes} minutos (${time})`;
    }
    
    return { title, body };
  } else {
    const title = `Ponto ${config.itemName}`;
    let body;
    
    if (type === 'advance') {
      if (minutes === 0) {
        body = `Ônibus saindo agora às ${time}`;
      } else {
        body = `Ônibus sai em ${minutes} minutos (${time})`;
      }
    } else {
      body = `Ônibus passou há ${minutes} minutos (${time})`;
    }
    
    return { title, body };
  }
}

// Lidar com cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notificação clicada:', event);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Abrir ou focar na aplicação
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        console.log('SW: Clientes encontrados:', clientList.length);
        // Se já existe uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('SW: Focando cliente existente');
            return client.focus();
          }
        }
        // Senão, abrir nova janela
        if (clients.openWindow) {
          console.log('SW: Abrindo nova janela');
          return clients.openWindow('/');
        }
      })
    );
  }
  // Se action === 'dismiss', apenas fechar a notificação
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(checkPendingNotifications());
  }
});

// Verificar alertas agendados periodicamente
async function checkScheduledAlerts() {
  try {
    console.log('SW: Verificando alertas agendados...');
    await checkPendingNotifications();
  } catch (error) {
    console.error('SW: Erro ao verificar alertas:', error);
  }
}

// Lidar com push events (para futuras melhorias com server push)
self.addEventListener('push', (event) => {
  console.log('SW: Push event recebido:', event);
  
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      showNotification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: data.data || {}
      })
    );
  }
});
