import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '../../database/entities/status.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateStatusDto, UpdateStatusDto } from './dto/status.dto';

@Injectable()
export class StatusesService {
  private readonly logger = new Logger(StatusesService.name);

  constructor(
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ──────────────────────────────────────────────
  // FIND ALL (system defaults + user custom)
  // ──────────────────────────────────────────────
  async findAll(userId: number) {
    const statuses = await this.statusRepo
      .createQueryBuilder('s')
      .where('s.defaut = 1')
      .orWhere('s.user_id = :userId', { userId })
      .orderBy('s.ordre', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();

    return {
      success: true,
      data: statuses.map((s) => this.serialize(s)),
    };
  }

  // ──────────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────────
  async findOne(userId: number, id: number) {
    const status = await this.statusRepo.findOne({ where: { id } });
    if (!status) {
      throw new NotFoundException(`Statut #${id} introuvable`);
    }

    // Access: system statuses visible to all, custom only to owner
    if (status.defaut !== 1 && status.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return { success: true, data: this.serialize(status) };
  }

  // ──────────────────────────────────────────────
  // CREATE (Premium/Admin only)
  // ──────────────────────────────────────────────
  async create(userId: number, dto: CreateStatusDto) {
    await this.checkPremiumOrAdmin(userId);

    const status = this.statusRepo.create({
      userId,
      name: dto.name,
      description: dto.description || null,
      color: dto.color || '#6b7280',
      icon: dto.icon || 'tag',
      ordre: dto.ordre ?? 0,
      defaut: 0,
    });

    const saved = await this.statusRepo.save(status);
    this.logger.log(`Status created: ${saved.name} (id: ${saved.id}) by user ${userId}`);

    return {
      success: true,
      message: 'Statut créé',
      data: this.serialize(saved),
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  async update(userId: number, id: number, dto: UpdateStatusDto) {
    const status = await this.statusRepo.findOne({ where: { id } });
    if (!status) throw new NotFoundException(`Statut #${id} introuvable`);

    // Cannot edit system defaults
    if (status.defaut === 1) {
      throw new ForbiddenException('Impossible de modifier un statut système');
    }
    if (status.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (dto.name !== undefined) status.name = dto.name;
    if (dto.description !== undefined) status.description = dto.description || null;
    if (dto.color !== undefined) status.color = dto.color;
    if (dto.icon !== undefined) status.icon = dto.icon;
    if (dto.ordre !== undefined) status.ordre = dto.ordre;

    await this.statusRepo.save(status);
    this.logger.log(`Status updated: ${status.name} (id: ${status.id})`);

    return { success: true, message: 'Statut mis à jour', data: this.serialize(status) };
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────
  async remove(userId: number, id: number) {
    const status = await this.statusRepo.findOne({ where: { id } });
    if (!status) throw new NotFoundException(`Statut #${id} introuvable`);

    if (status.defaut === 1) {
      throw new ForbiddenException('Impossible de supprimer un statut système');
    }
    if (status.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.statusRepo.remove(status);
    this.logger.log(`Status deleted: ${status.name} (id: ${id})`);

    return { success: true, message: 'Statut supprimé' };
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
  private serialize(s: Status) {
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      color: s.color,
      icon: s.icon,
      ordre: s.ordre,
      defaut: s.defaut === 1,
      isSystem: s.defaut === 1,
    };
  }

  private async checkPremiumOrAdmin(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.PREMIUM && user.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Fonctionnalité réservée Premium/Admin');
    }
  }
}
