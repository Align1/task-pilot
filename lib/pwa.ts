// PWA utilities for service worker and installation

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[PWA] New version available');
            
            // Notify user
            if (window.confirm('A new version is available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister service worker (for development/debugging)
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
    return false;
  }
};

/**
 * Check if app is installed as PWA
 */
export const isPWAInstalled = (): boolean => {
  try {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check iOS specific
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    return isStandalone || isIOSStandalone;
  } catch (error) {
    return false;
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> => {
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('[PWA] Notification permission denied');
      return null;
    }

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      // Note: You'll need to generate VAPID keys for production
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('[PWA] Push subscription created');
    }

    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push:', error);
    return null;
  }
};

/**
 * Send push subscription to server
 */
export const sendSubscriptionToServer = async (
  subscription: PushSubscription,
  token: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    return response.ok;
  } catch (error) {
    console.error('[PWA] Failed to send subscription:', error);
    return false;
  }
};

/**
 * Show notification (fallback for non-push)
 */
export const showNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  try {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return;
    }

    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options
        });
      } else {
        new Notification(title, options);
      }
    }
  } catch (error) {
    console.log('[PWA] Could not show notification:', error);
    // Silently fail - notifications are optional
  }
};

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if app needs update
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
};

/**
 * Get cache size
 */
export const getCacheSize = async (): Promise<number> => {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to calculate cache size:', error);
    return 0;
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<boolean> => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[PWA] All caches cleared');
    return true;
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
    return false;
  }
};

