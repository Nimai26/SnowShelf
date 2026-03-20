import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocation } from '../../database/entities/storage-location.entity';
import { CreateStorageLocationDto, UpdateStorageLocationDto } from './dto/storage-location.dto';

@Injectable()
export class StorageLocationsService {
  private readonly logger = new Logger(StorageLocationsService.name);

  constructor(
    @InjectRepository(StorageLocation)
    private readonly locRepo: Repository<StorageLocation>,
  ) {}

  // ──────────────────────────────────────────────
  // FIND ALL (user's locations)
  // ──────────────────────────────────────────────
  async findAll(userId: number) {
    const locations = await this.locRepo.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    return {
      success: true,
      data: locations.map((l) => this.serialize(l)),
    };
  }

  // ──────────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────────
  async findOne(userId: number, id: number) {
    const loc = await this.locRepo.findOne({ where: { id, userId } });
    if (!loc) throw new NotFoundException(`Emplacement #${id} introuvable`);

    return { success: true, data: this.serialize(loc) };
  }

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────
  async create(userId: number, dto: CreateStorageLocationDto) {
    const loc = this.locRepo.create({
      userId,
      name: dto.name,
      description: dto.description || null,
    });

    const saved = await this.locRepo.save(loc);
    this.logger.log(`StorageLocation created: ${saved.name} (id: ${saved.id}) by user ${userId}`);

    return {
      success: true,
      message: 'Emplacement créé',
      data: this.serialize(saved),
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  async update(userId: number, id: number, dto: UpdateStorageLocationDto) {
    const loc = await this.locRepo.findOne({ where: { id, userId } });
    if (!loc) throw new NotFoundException(`Emplacement #${id} introuvable`);

    if (dto.name !== undefined) loc.name = dto.name;
    if (dto.description !== undefined) loc.description = dto.description || null;

    await this.locRepo.save(loc);
    this.logger.log(`StorageLocation updated: ${loc.name} (id: ${loc.id})`);

    return { success: true, message: 'Emplacement mis à jour', data: this.serialize(loc) };
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────
  async remove(userId: number, id: number) {
    const loc = await this.locRepo.findOne({ where: { id, userId } });
    if (!loc) throw new NotFoundException(`Emplacement #${id} introuvable`);

    await this.locRepo.remove(loc);
    this.logger.log(`StorageLocation deleted: ${loc.name} (id: ${id})`);

    return { success: true, message: 'Emplacement supprimé' };
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
  private serialize(l: StorageLocation) {
    return {
      id: l.id,
      name: l.name,
      description: l.description,
      itemsCount: l.itemsCount,
    };
  }
}
