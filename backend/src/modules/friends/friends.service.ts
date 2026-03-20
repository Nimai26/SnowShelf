import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Friendship, FriendshipStatus } from '../../database/entities/friendship.entity';
import { User, FriendRequestPolicy } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ──────────────────────────────────────────────
  // SEND FRIEND REQUEST BY EMAIL
  // ──────────────────────────────────────────────
  async sendRequestByEmail(requesterId: number, email: string) {
    const addressee = await this.userRepo.findOne({ where: { email } });

    // Privacy: merge "not found" and "refuses requests" into a single message
    if (!addressee || addressee.id === requesterId) {
      return { success: true, data: { result: 'not_found' } };
    }

    if (addressee.friendRequestPolicy === FriendRequestPolicy.NOBODY) {
      return { success: true, data: { result: 'not_found' } };
    }

    // Check existing relationship
    const existing = await this.friendshipRepo.findOne({
      where: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        return { success: true, data: { result: 'already_friends', username: addressee.username } };
      }
      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.requesterId === addressee.id) {
          // Auto-accept reverse request
          existing.status = FriendshipStatus.ACCEPTED;
          await this.friendshipRepo.save(existing);

          const requester = await this.userRepo.findOne({ where: { id: requesterId } });
          await this.notificationsService.create(
            addressee.id,
            NotificationType.FRIEND_ACCEPTED,
            'Demande d\'ami acceptée',
            `${requester?.username} a accepté votre demande d'ami.`,
            { friendshipId: existing.id, fromUserId: requesterId },
          );

          return { success: true, data: { result: 'accepted', username: addressee.username } };
        }
        return { success: true, data: { result: 'already_sent', username: addressee.username } };
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        return { success: true, data: { result: 'not_found' } };
      }
      if (existing.status === FriendshipStatus.DECLINED) {
        existing.requesterId = requesterId;
        existing.addresseeId = addressee.id;
        existing.status = FriendshipStatus.PENDING;
        await this.friendshipRepo.save(existing);

        const requester = await this.userRepo.findOne({ where: { id: requesterId } });
        await this.notificationsService.create(
          addressee.id,
          NotificationType.FRIEND_REQUEST,
          'Nouvelle demande d\'ami',
          `${requester?.username} vous a envoyé une demande d'ami.`,
          { friendshipId: existing.id, fromUserId: requesterId },
        );

        return { success: true, data: { result: 'sent', username: addressee.username } };
      }
    }

    // Create new friendship
    const friendship = this.friendshipRepo.create({
      requesterId,
      addresseeId: addressee.id,
      status: FriendshipStatus.PENDING,
    });
    const saved = await this.friendshipRepo.save(friendship);

    const requester = await this.userRepo.findOne({ where: { id: requesterId } });
    await this.notificationsService.create(
      addressee.id,
      NotificationType.FRIEND_REQUEST,
      'Nouvelle demande d\'ami',
      `${requester?.username} vous a envoyé une demande d'ami.`,
      { friendshipId: saved.id, fromUserId: requesterId },
    );

    this.logger.log(`Friend request by email: ${requesterId} → ${addressee.id}`);
    return { success: true, data: { result: 'sent', username: addressee.username } };
  }

  // ──────────────────────────────────────────────
  // SEND FRIEND REQUEST
  // ──────────────────────────────────────────────
  async sendRequest(requesterId: number, addresseeId: number) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Vous ne pouvez pas vous ajouter vous-même');
    }

    const addressee = await this.userRepo.findOne({ where: { id: addresseeId } });
    if (!addressee) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (addressee.friendRequestPolicy === FriendRequestPolicy.NOBODY) {
      throw new ForbiddenException('Cet utilisateur n\'accepte pas les demandes d\'ami');
    }

    // Check if there's already a relationship
    const existing = await this.friendshipRepo.findOne({
      where: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Vous êtes déjà amis');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        // If the other person sent the request, auto-accept
        if (existing.requesterId === addresseeId) {
          existing.status = FriendshipStatus.ACCEPTED;
          await this.friendshipRepo.save(existing);

          // Notify the original requester
          await this.notificationsService.create(
            addresseeId,
            NotificationType.FRIEND_ACCEPTED,
            'Demande d\'ami acceptée',
            `${(await this.userRepo.findOne({ where: { id: requesterId } }))?.username} a accepté votre demande d'ami.`,
            { friendshipId: existing.id, fromUserId: requesterId },
          );

          return { success: true, data: { status: 'accepted' } };
        }
        throw new ConflictException('Demande déjà envoyée');
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        if (existing.addresseeId === requesterId) {
          throw new ForbiddenException('Vous avez été bloqué par cet utilisateur');
        }
        throw new ForbiddenException('Vous avez bloqué cet utilisateur');
      }
      if (existing.status === FriendshipStatus.DECLINED) {
        // Allow re-sending after declined
        existing.requesterId = requesterId;
        existing.addresseeId = addresseeId;
        existing.status = FriendshipStatus.PENDING;
        await this.friendshipRepo.save(existing);

        await this.notificationsService.create(
          addresseeId,
          NotificationType.FRIEND_REQUEST,
          'Nouvelle demande d\'ami',
          `${(await this.userRepo.findOne({ where: { id: requesterId } }))?.username} vous a envoyé une demande d'ami.`,
          { friendshipId: existing.id, fromUserId: requesterId },
        );

        return { success: true, data: { status: 'pending' } };
      }
    }

    // Create new friendship
    const friendship = this.friendshipRepo.create({
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    });
    const saved = await this.friendshipRepo.save(friendship);

    const requester = await this.userRepo.findOne({ where: { id: requesterId } });
    await this.notificationsService.create(
      addresseeId,
      NotificationType.FRIEND_REQUEST,
      'Nouvelle demande d\'ami',
      `${requester?.username} vous a envoyé une demande d'ami.`,
      { friendshipId: saved.id, fromUserId: requesterId },
    );

    this.logger.log(`Friend request: ${requesterId} → ${addresseeId}`);
    return { success: true, data: { status: 'pending' } };
  }

  // ──────────────────────────────────────────────
  // ACCEPT REQUEST
  // ──────────────────────────────────────────────
  async acceptRequest(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId, addresseeId: userId, status: FriendshipStatus.PENDING },
    });

    if (!friendship) {
      throw new NotFoundException('Demande non trouvée');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipRepo.save(friendship);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    await this.notificationsService.create(
      friendship.requesterId,
      NotificationType.FRIEND_ACCEPTED,
      'Demande d\'ami acceptée',
      `${user?.username} a accepté votre demande d'ami.`,
      { friendshipId: friendship.id, fromUserId: userId },
    );

    this.logger.log(`Friendship accepted: ${friendship.id}`);
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // DECLINE REQUEST
  // ──────────────────────────────────────────────
  async declineRequest(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId, addresseeId: userId, status: FriendshipStatus.PENDING },
    });

    if (!friendship) {
      throw new NotFoundException('Demande non trouvée');
    }

    friendship.status = FriendshipStatus.DECLINED;
    await this.friendshipRepo.save(friendship);

    this.logger.log(`Friendship declined: ${friendship.id}`);
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // BLOCK USER
  // ──────────────────────────────────────────────
  async blockUser(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new BadRequestException('Action impossible');
    }

    let friendship = await this.friendshipRepo.findOne({
      where: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    });

    if (friendship) {
      friendship.status = FriendshipStatus.BLOCKED;
      // Ensure the blocker is the addressee (convention: addressee is the one who blocks)
      friendship.requesterId = targetId;
      friendship.addresseeId = userId;
      await this.friendshipRepo.save(friendship);
    } else {
      friendship = this.friendshipRepo.create({
        requesterId: targetId,
        addresseeId: userId,
        status: FriendshipStatus.BLOCKED,
      });
      await this.friendshipRepo.save(friendship);
    }

    this.logger.log(`User ${userId} blocked ${targetId}`);
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // REMOVE FRIEND / CANCEL REQUEST / UNBLOCK
  // ──────────────────────────────────────────────
  async removeFriendship(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepo.findOne({
      where: [
        { id: friendshipId, requesterId: userId },
        { id: friendshipId, addresseeId: userId },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Relation non trouvée');
    }

    await this.friendshipRepo.remove(friendship);

    this.logger.log(`Friendship removed: ${friendshipId} by user ${userId}`);
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // GET FRIENDS LIST
  // ──────────────────────────────────────────────
  async getFriends(userId: number, page = 1, limit = 50) {
    limit = Math.min(limit, 100);

    const [friendships, total] = await this.friendshipRepo.findAndCount({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const friends = friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        bio: friend.bio,
        itemsCount: friend.itemsCount,
        collectionsVisibility: friend.collectionsVisibility,
        since: f.updatedAt,
      };
    });

    return {
      success: true,
      data: {
        friends,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  // ──────────────────────────────────────────────
  // GET RECEIVED REQUESTS
  // ──────────────────────────────────────────────
  async getReceivedRequests(userId: number) {
    const requests = await this.friendshipRepo.find({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      data: requests.map((r) => ({
        friendshipId: r.id,
        id: r.requester.id,
        username: r.requester.username,
        avatarUrl: r.requester.avatarUrl,
        bio: r.requester.bio,
        sentAt: r.createdAt,
      })),
    };
  }

  // ──────────────────────────────────────────────
  // GET SENT REQUESTS
  // ──────────────────────────────────────────────
  async getSentRequests(userId: number) {
    const requests = await this.friendshipRepo.find({
      where: { requesterId: userId, status: FriendshipStatus.PENDING },
      relations: ['addressee'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      data: requests.map((r) => ({
        friendshipId: r.id,
        id: r.addressee.id,
        username: r.addressee.username,
        avatarUrl: r.addressee.avatarUrl,
        bio: r.addressee.bio,
        sentAt: r.createdAt,
      })),
    };
  }

  // ──────────────────────────────────────────────
  // GET FRIENDSHIP STATUS WITH A USER
  // ──────────────────────────────────────────────
  async getFriendshipStatus(userId: number, targetId: number) {
    if (userId === targetId) {
      return { success: true, data: { status: 'self' as const, friendshipId: null } };
    }

    const friendship = await this.friendshipRepo.findOne({
      where: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    });

    if (!friendship) {
      return { success: true, data: { status: 'none' as const, friendshipId: null } };
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return { success: true, data: { status: 'friends' as const, friendshipId: friendship.id } };
    }

    if (friendship.status === FriendshipStatus.PENDING) {
      if (friendship.requesterId === userId) {
        return { success: true, data: { status: 'request_sent' as const, friendshipId: friendship.id } };
      }
      return { success: true, data: { status: 'request_received' as const, friendshipId: friendship.id } };
    }

    if (friendship.status === FriendshipStatus.BLOCKED) {
      if (friendship.addresseeId === userId) {
        return { success: true, data: { status: 'blocked_by_you' as const, friendshipId: friendship.id } };
      }
      return { success: true, data: { status: 'blocked' as const, friendshipId: friendship.id } };
    }

    // declined
    return { success: true, data: { status: 'none' as const, friendshipId: null } };
  }

  // ──────────────────────────────────────────────
  // HELPER: Check if two users are friends
  // ──────────────────────────────────────────────
  async areFriends(userId: number, targetId: number): Promise<boolean> {
    const count = await this.friendshipRepo.count({
      where: [
        { requesterId: userId, addresseeId: targetId, status: FriendshipStatus.ACCEPTED },
        { requesterId: targetId, addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return count > 0;
  }

  // ──────────────────────────────────────────────
  // GET PENDING REQUESTS COUNT (for badge)
  // ──────────────────────────────────────────────
  async getPendingCount(userId: number): Promise<number> {
    return this.friendshipRepo.count({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
    });
  }
}
