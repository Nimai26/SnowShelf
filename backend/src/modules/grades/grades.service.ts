import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grade } from '../../database/entities/grade.entity';
import { Category } from '../../database/entities/category.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ──────────────────────────────────────────────
  // FIND ALL (system + user custom)
  // ──────────────────────────────────────────────
  async findAll(userId: number) {
    const grades = await this.gradeRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.categories', 'cat')
      .where('g.defaut = 1')
      .orWhere('g.user_id = :userId', { userId })
      .orderBy('g.defaut', 'DESC')
      .addOrderBy('g.name', 'ASC')
      .getMany();

    return {
      success: true,
      data: grades.map((g) => this.serialize(g)),
    };
  }

  // ──────────────────────────────────────────────
  // FIND BY CATEGORIES (union of grades linked to given categories)
  // ──────────────────────────────────────────────
  async findByCategories(userId: number, categoryIds: number[]) {
    if (!categoryIds || categoryIds.length === 0) {
      return { success: true, data: [] };
    }

    const grades = await this.gradeRepo
      .createQueryBuilder('g')
      .innerJoin('g.categories', 'cat', 'cat.id IN (:...categoryIds)', { categoryIds })
      .where('(g.defaut = 1 OR g.user_id = :userId)', { userId })
      .orderBy('g.name', 'ASC')
      .getMany();

    // Deduplicate (a grade may be linked to multiple of the selected categories)
    const uniqueGrades = [...new Map(grades.map((g) => [g.id, g])).values()];

    return {
      success: true,
      data: uniqueGrades.map((g) => ({ id: g.id, name: g.name, description: g.description })),
    };
  }

  // ──────────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────────
  async findOne(userId: number, id: number) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!grade) throw new NotFoundException(`Grade #${id} introuvable`);

    if (grade.defaut !== 1 && grade.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return { success: true, data: this.serialize(grade) };
  }

  // ──────────────────────────────────────────────
  // CREATE (Premium/Admin only)
  // ──────────────────────────────────────────────
  async create(userId: number, dto: CreateGradeDto) {
    await this.checkPremiumOrAdmin(userId);

    let categories: Category[] = [];
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      categories = await this.catRepo.findBy({ id: In(dto.categoryIds) });
    }

    const grade = this.gradeRepo.create({
      userId,
      name: dto.name,
      description: dto.description || null,
      defaut: 0,
      categories,
    });

    const saved = await this.gradeRepo.save(grade);
    this.logger.log(`Grade created: ${saved.name} (id: ${saved.id}) by user ${userId}`);

    return {
      success: true,
      message: 'Grade créé',
      data: this.serialize(saved),
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  async update(userId: number, id: number, dto: UpdateGradeDto) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!grade) throw new NotFoundException(`Grade #${id} introuvable`);

    if (grade.defaut === 1) {
      throw new ForbiddenException('Impossible de modifier un grade système');
    }
    if (grade.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (dto.name !== undefined) grade.name = dto.name;
    if (dto.description !== undefined) grade.description = dto.description || null;

    if (dto.categoryIds !== undefined) {
      grade.categories = dto.categoryIds.length > 0
        ? await this.catRepo.findBy({ id: In(dto.categoryIds) })
        : [];
    }

    await this.gradeRepo.save(grade);
    this.logger.log(`Grade updated: ${grade.name} (id: ${grade.id})`);

    return { success: true, message: 'Grade mis à jour', data: this.serialize(grade) };
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────
  async remove(userId: number, id: number) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException(`Grade #${id} introuvable`);

    if (grade.defaut === 1) {
      throw new ForbiddenException('Impossible de supprimer un grade système');
    }
    if (grade.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.gradeRepo.remove(grade);
    this.logger.log(`Grade deleted: ${grade.name} (id: ${id})`);

    return { success: true, message: 'Grade supprimé' };
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
  private serialize(g: Grade) {
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      defaut: g.defaut === 1,
      isSystem: g.defaut === 1,
      categories: (g.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
      })),
    };
  }

  private async checkPremiumOrAdmin(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.PREMIUM && user.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Fonctionnalité réservée Premium/Admin');
    }
  }
}
