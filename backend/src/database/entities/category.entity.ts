import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Grade } from './grade.entity';
import { PrimaryType } from './primary-type.entity';
import { CategoryRelationship } from './category-relationship.entity';
import { CategoryRelationshipDefault } from './category-relationship-default.entity';
import { CategoryImage } from './category-image.entity';
import { CategoryVideo } from './category-video.entity';
import { CategoryAudio } from './category-audio.entity';
import { CategoryDocument } from './category-document.entity';
import { CategoryField } from './category-field.entity';

@Entity('categories')
@Index('unique_user_name', ['userId', 'name'], { unique: true })
@Index('unique_user_slug', ['userId', 'slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  @Index('idx_category_user')
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'original_creator_id', type: 'int', unsigned: true, nullable: true })
  originalCreatorId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'original_creator_id' })
  originalCreator: User;

  // ── Type d'objet (obligatoire) ───
  @Column({ name: 'primary_type_id', type: 'int', unsigned: true, nullable: true })
  @Index('idx_category_primary_type')
  primaryTypeId: number | null;

  @ManyToOne(() => PrimaryType, { onDelete: 'RESTRICT', nullable: true, eager: false })
  @JoinColumn({ name: 'primary_type_id' })
  primaryType: PrimaryType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  @Index('idx_category_slug')
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Visual
  @Column({ type: 'varchar', length: 255, default: '📁' })
  icon: string;

  @Column({
    type: 'enum',
    enum: ['emoji', 'url'],
    name: 'icon_type',
    default: 'emoji',
  })
  iconType: 'emoji' | 'url';

  @Column({ type: 'varchar', length: 7, default: '#3498db' })
  color: string;

  // ── Providers Tako par défaut ───
  @Column({ name: 'default_providers', type: 'simple-json', nullable: true })
  defaultProviders: string[] | null;

  // Flags
  @Column({ name: 'is_default', type: 'boolean', default: false })
  @Index('idx_category_default')
  isDefault: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  @Index('idx_category_public')
  isPublic: boolean;

  // Statistics
  @Column({ name: 'items_count', type: 'int', unsigned: true, default: 0 })
  itemsCount: number;

  // Hierarchy - per-user relationships (as parent)
  @OneToMany(() => CategoryRelationship, (rel) => rel.parent)
  childRelationships: CategoryRelationship[];

  // Hierarchy - per-user relationships (as child)
  @OneToMany(() => CategoryRelationship, (rel) => rel.child)
  parentRelationships: CategoryRelationship[];

  // Hierarchy - default relationships (as parent)
  @OneToMany(() => CategoryRelationshipDefault, (rel) => rel.parent)
  defaultChildRelationships: CategoryRelationshipDefault[];

  // Hierarchy - default relationships (as child)
  @OneToMany(() => CategoryRelationshipDefault, (rel) => rel.child)
  defaultParentRelationships: CategoryRelationshipDefault[];

  // Grades association
  @ManyToMany(() => Grade, (grade) => grade.categories)
  grades: Grade[];

  // Category-level fields (EAV)
  @OneToMany(() => CategoryField, (f) => f.category, { cascade: true })
  fields: CategoryField[];

  // Media
  @OneToMany(() => CategoryImage, (img) => img.category)
  images: CategoryImage[];

  @OneToMany(() => CategoryVideo, (vid) => vid.category)
  videos: CategoryVideo[];

  @OneToMany(() => CategoryAudio, (aud) => aud.category)
  audio: CategoryAudio[];

  @OneToMany(() => CategoryDocument, (doc) => doc.category)
  documents: CategoryDocument[];

  // Soft delete
  @DeleteDateColumn({ name: 'deleted_at' })
  @Index('idx_category_deleted')
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
