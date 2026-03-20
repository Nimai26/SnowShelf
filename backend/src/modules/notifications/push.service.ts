import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import * as crypto from 'crypto';
import { PushSubscription } from '../../database/entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidSubject: string;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subRepo: Repository<PushSubscription>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.vapidPublicKey =
      this.config.get<string>('VAPID_PUBLIC_KEY') || '';
    this.vapidPrivateKey =
      this.config.get<string>('VAPID_PRIVATE_KEY') || '';
    this.vapidSubject =
      this.config.get<string>('VAPID_SUBJECT') || 'mailto:admin@snowshelf.fr';

    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      this.logger.warn(
        'VAPID keys not configured — generating temporary keys. ' +
          'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment.',
      );
      const keys = webpush.generateVAPIDKeys();
      this.vapidPublicKey = keys.publicKey;
      this.vapidPrivateKey = keys.privateKey;
      this.logger.log(`Generated VAPID public key: ${this.vapidPublicKey}`);
      this.logger.log(
        `Generated VAPID private key: ${this.vapidPrivateKey}`,
      );
      this.logger.log(
        '⚠️  Copy these keys to your .env to persist them across restarts!',
      );
    }

    webpush.setVapidDetails(
      this.vapidSubject,
      this.vapidPublicKey,
      this.vapidPrivateKey,
    );

    this.logger.log('Push notification service initialized');
  }

  /**
   * Returns the VAPID public key for the frontend
   * to use when subscribing to push.
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Register or update a push subscription for a user.
   */
  async subscribe(
    userId: number,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    userAgent?: string,
  ): Promise<PushSubscription> {
    const endpointHash = crypto
      .createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex');

    // Check if this endpoint already exists
    let existing = await this.subRepo.findOne({
      where: { endpointHash },
    });

    if (existing) {
      // Update existing subscription
      existing.userId = userId;
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.isActive = true;
      existing.failureCount = 0;
      if (userAgent) existing.userAgent = userAgent;
      return this.subRepo.save(existing);
    }

    // Create new subscription
    const sub = this.subRepo.create({
      userId,
      endpoint: subscription.endpoint,
      endpointHash,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
      isActive: true,
      failureCount: 0,
    });

    return this.subRepo.save(sub);
  }

  /**
   * Remove a push subscription (user unsubscribed).
   */
  async unsubscribe(userId: number, endpoint: string): Promise<void> {
    const endpointHash = crypto
      .createHash('sha256')
      .update(endpoint)
      .digest('hex');

    await this.subRepo.update(
      { userId, endpointHash },
      { isActive: false },
    );
  }

  /**
   * Send a push notification to a single user.
   * Tries all active subscriptions for that user.
   */
  async sendToUser(userId: number, payload: PushPayload): Promise<number> {
    const subscriptions = await this.subRepo.find({
      where: { userId, isActive: true },
    });

    if (!subscriptions.length) return 0;

    let sent = 0;
    const payloadStr = JSON.stringify(payload);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr,
          { TTL: 60 * 60 * 24 }, // 24h TTL
        );

        // Success — reset failure count
        await this.subRepo.update(sub.id, {
          lastPushAt: new Date(),
          failureCount: 0,
        });
        sent++;
      } catch (error: any) {
        const statusCode = error?.statusCode;

        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — deactivate
          this.logger.debug(
            `Push subscription ${sub.id} expired (${statusCode}), deactivating`,
          );
          await this.subRepo.update(sub.id, { isActive: false });
        } else {
          // Other error — increment failure count
          const newCount = sub.failureCount + 1;
          if (newCount >= 5) {
            this.logger.warn(
              `Push subscription ${sub.id} has ${newCount} failures, deactivating`,
            );
            await this.subRepo.update(sub.id, {
              failureCount: newCount,
              isActive: false,
            });
          } else {
            await this.subRepo.update(sub.id, {
              failureCount: newCount,
            });
          }
        }
      }
    }

    return sent;
  }

  /**
   * Send to multiple users (broadcast).
   */
  async sendToUsers(
    userIds: number[],
    payload: PushPayload,
  ): Promise<number> {
    let total = 0;
    for (const userId of userIds) {
      total += await this.sendToUser(userId, payload);
    }
    return total;
  }

  /**
   * Get active subscription count for a user.
   */
  async getSubscriptionCount(userId: number): Promise<number> {
    return this.subRepo.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Clean up expired/failed subscriptions (called periodically).
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.subRepo.delete({
      isActive: false,
    });
    return result.affected || 0;
  }
}
