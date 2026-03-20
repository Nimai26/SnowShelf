import apiClient from './api';

/**
 * Service Push Notifications — gestion des souscriptions push
 * via le backend SnowShelf.
 */
export const pushService = {
  /**
   * Récupère la clé publique VAPID depuis le backend.
   */
  async getVapidPublicKey(): Promise<string> {
    const { data } = await apiClient.get('/api/v1/notifications/push/vapid-key');
    return data.data.publicKey;
  },

  /**
   * Enregistre une souscription push auprès du backend.
   */
  async subscribe(subscription: PushSubscriptionJSON): Promise<void> {
    await apiClient.post('/api/v1/notifications/push/subscribe', {
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
        },
      },
    });
  },

  /**
   * Supprime la souscription push côté backend.
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await apiClient.post('/api/v1/notifications/push/unsubscribe', { endpoint });
  },

  /**
   * Vérifie le statut push de l'utilisateur.
   */
  async getStatus(): Promise<{ subscriptionCount: number; pushEnabled: boolean }> {
    const { data } = await apiClient.get('/api/v1/notifications/push/status');
    return data.data;
  },
};
