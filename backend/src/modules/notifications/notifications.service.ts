import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────
  async create(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId,
      type,
      title,
      message,
      metadata: metadata || null,
    });
    const saved = await this.notifRepo.save(notif);
    this.logger.log(`Notification created for user ${userId}: ${type}`);
    return saved;
  }

  // ──────────────────────────────────────────────
  // WELCOME NOTIFICATION (appelé après register)
  // ──────────────────────────────────────────────
  async sendWelcome(userId: number, username: string) {
    return this.create(
      userId,
      NotificationType.WELCOME,
      'Bienvenue sur SnowShelf ! 🎉',
      `Bonjour ${username} ! Commencez par créer votre première collection.`,
    );
  }

  // ──────────────────────────────────────────────
  // GET ALL FOR USER
  // ──────────────────────────────────────────────
  async findAllForUser(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────
  // UNREAD COUNT
  // ──────────────────────────────────────────────
  async getUnreadCount(userId: number): Promise<number> {
    return this.notifRepo.count({
      where: { userId, isRead: false },
    });
  }

  // ──────────────────────────────────────────────
  // MARK AS READ
  // ──────────────────────────────────────────────
  async markAsRead(userId: number, notifId: number) {
    const notif = await this.notifRepo.findOne({
      where: { id: notifId, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notification non trouvée');
    }

    notif.isRead = true;
    notif.readAt = new Date();
    await this.notifRepo.save(notif);

    return { success: true };
  }

  // ──────────────────────────────────────────────
  // MARK ALL AS READ
  // ──────────────────────────────────────────────
  async markAllAsRead(userId: number) {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { success: true, message: 'Toutes les notifications marquées comme lues' };
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────
  async delete(userId: number, notifId: number) {
    const result = await this.notifRepo.delete({ id: notifId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification non trouvée');
    }
    return { success: true };
  }
}
