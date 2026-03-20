import { useState, useEffect, useCallback } from 'react';
import { pushService } from '../services/push.service';

/**
 * Convertit une clé base64url en Uint8Array
 * pour l'applicationServerKey du push manager.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushPermission = 'default' | 'granted' | 'denied';

interface UsePushNotificationsReturn {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Current permission state */
  permission: PushPermission;
  /** Whether push is currently subscribed */
  isSubscribed: boolean;
  /** Loading state */
  loading: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
}

/**
 * Hook pour gérer les Push Notifications côté frontend.
 * Gère la permission, la souscription et la communication avec le backend.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported] = useState(
    () =>
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window,
  );
  const [permission, setPermission] = useState<PushPermission>(
    isSupported ? (Notification.permission as PushPermission) : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        // Silently fail
      }
    };

    checkSubscription();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);

      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      // 2. Get VAPID public key from backend
      const vapidKey = await pushService.getVapidPublicKey();

      // 3. Subscribe in the push manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // 4. Send subscription to backend
      const subJson = subscription.toJSON();
      await pushService.subscribe(subJson);

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from backend
        await pushService.unsubscribe(subscription.endpoint);
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
