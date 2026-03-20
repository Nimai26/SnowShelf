import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { Item } from '../../database/entities/item.entity';
import { Category } from '../../database/entities/category.entity';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  // ──────────────────────────────────────────────
  // DASHBOARD STATS
  // ──────────────────────────────────────────────

  async getDashboardStats() {
    // Users stats
    const totalUsers = await this.userRepo.count();
    const freeUsers = await this.userRepo.count({ where: { role: UserRole.FREE } });
    const premiumUsers = await this.userRepo.count({ where: { role: UserRole.PREMIUM } });
    const adminUsers = await this.userRepo.count({ where: { role: UserRole.ADMIN } });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at >= :start', { start: startOfMonth })
      .getCount();

    // Items stats
    const totalItems = await this.itemRepo.count();

    // Items by type
    const itemsByType = await this.itemRepo
      .createQueryBuilder('i')
      .select('pt.name_fr', 'typeName')
      .addSelect('pt.icon', 'typeIcon')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('primary_types', 'pt', 'pt.id = i.primary_type_id')
      .groupBy('pt.id')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Total value
    const valueResult = await this.itemRepo
      .createQueryBuilder('i')
      .select('SUM(i.market_value)', 'totalValue')
      .getRawOne();
    const totalValue = parseFloat(valueResult?.totalValue || '0');

    // Categories stats
    const totalCategories = await this.categoryRepo.count();

    // Recent registrations (last 30 days, grouped by day)
    const registrationsTrend = await this.userRepo
      .createQueryBuilder('u')
      .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Items creation trend (last 30 days)
    const itemsTrend = await this.itemRepo
      .createQueryBuilder('i')
      .select("DATE_FORMAT(i.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      users: {
        total: totalUsers,
        free: freeUsers,
        premium: premiumUsers,
        admin: adminUsers,
        newThisMonth: newUsersThisMonth,
      },
      items: {
        total: totalItems,
        byType: itemsByType.map((r) => ({
          name: r.typeName,
          icon: r.typeIcon,
          count: parseInt(r.count, 10),
        })),
        totalValue,
      },
      categories: {
        total: totalCategories,
      },
      trends: {
        registrations: registrationsTrend.map((r) => ({
          date: r.date,
          count: parseInt(r.count, 10),
        })),
        items: itemsTrend.map((r) => ({
          date: r.date,
          count: parseInt(r.count, 10),
        })),
      },
    };
  }

  // ──────────────────────────────────────────────
  // USERS MANAGEMENT
  // ──────────────────────────────────────────────

  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
    role?: UserRole,
    sort: 'createdAt' | 'username' | 'itemsCount' = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.userRepo.createQueryBuilder('u');

    if (search) {
      qb.where('(u.username LIKE :search OR u.email LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (role) {
      qb.andWhere('u.role = :role', { role });
    }

    const sortColumn = sort === 'username' ? 'u.username' : sort === 'itemsCount' ? 'u.items_count' : 'u.created_at';
    qb.orderBy(sortColumn, order);

    const total = await qb.getCount();
    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        itemsCount: u.itemsCount,
        categoriesCount: u.categoriesCount,
        totalValue: u.totalValue,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        avatarUrl: u.avatarUrl,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async changeUserRole(
    adminId: number,
    targetUserId: number,
    newRole: UserRole,
  ) {
    if (adminId === targetUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = newRole;
    await this.userRepo.save(user);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  async deleteUser(adminId: number, targetUserId: number) {
    if (adminId === targetUserId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete an admin user');
    }

    await this.userRepo.remove(user);
    return { deleted: true, username: user.username };
  }

  // ──────────────────────────────────────────────
  // ACTIVITY LOGS
  // ──────────────────────────────────────────────

  async getRecentActivity(limit = 20) {
    // Recent items
    const recentItems = await this.itemRepo
      .createQueryBuilder('i')
      .select([
        'i.id',
        'i.name',
        'i.createdAt',
        'u.id',
        'u.username',
        'u.avatarUrl',
      ])
      .innerJoin('i.user', 'u')
      .orderBy('i.createdAt', 'DESC')
      .take(limit)
      .getMany();

    // Recent users
    const recentUsers = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.username', 'u.email', 'u.createdAt', 'u.avatarUrl'])
      .orderBy('u.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return {
      recentItems: recentItems.map((i) => ({
        id: i.id,
        name: i.name,
        createdAt: i.createdAt,
        user: {
          id: i.user.id,
          username: i.user.username,
          avatarUrl: i.user.avatarUrl,
        },
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
      })),
    };
  }

  // ──────────────────────────────────────────────
  // SYSTEM NOTIFICATIONS (broadcast to all users)
  // ──────────────────────────────────────────────

  async sendSystemNotification(title: string, message: string) {
    const users = await this.userRepo.find({ select: ['id'] });

    const notifications = users.map((user) =>
      this.notificationRepo.create({
        userId: user.id,
        type: 'system' as any,
        title,
        message,
      }),
    );

    await this.notificationRepo.save(notifications, { chunk: 100 });

    return { sent: notifications.length };
  }
}
