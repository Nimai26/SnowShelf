import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PrimaryType } from './primary-type.entity';
import { Category } from './category.entity';
import { ItemMetadata } from './item-metadata.entity';
import { Status } from './status.entity';
import { Grade } from './grade.entity';
import { StorageLocation } from './storage-location.entity';
import { ItemImage } from './item-image.entity';
import { ItemVideo } from './item-video.entity';
import { ItemAudio } from './item-audio.entity';
import { ItemDocument } from './item-document.entity';
import { ItemCategoryMetadata } from './item-category-metadata.entity';

export enum SearchState {
  LOOKING = 'looking',
  OWNED = 'owned',
}

@Entity('items')
@Index('idx_item_user_type', ['userId', 'primaryTypeId'])
@Index('idx_item_user_created', ['userId', 'createdAt'])
export class Item {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  @Index('idx_item_user')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'primary_type_id', type: 'int', unsigned: true })
  @Index('idx_item_type')
  primaryTypeId: number;

  @ManyToOne(() => PrimaryType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'primary_type_id' })
  primaryType: PrimaryType;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_item_name')
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'purchase_price', nullable: true })
  purchasePrice: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'market_value', nullable: true })
  @Index('idx_item_value')
  marketValue: number | null;

  // Rating
  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  @Index('idx_item_rating')
  rating: number | null;

  // Dates
  @Column({ type: 'date', name: 'date_obtained', nullable: true })
  @Index('idx_item_date_obtained')
  dateObtained: Date | null;

  // Search state (legacy, kept for compat — prefer statusId)
  @Column({
    type: 'enum',
    enum: SearchState,
    name: 'search_state',
    nullable: true,
  })
  @Index('idx_item_search_state')
  searchState: SearchState | null;

  // Status
  @Column({ name: 'status_id', type: 'int', unsigned: true, nullable: true })
  @Index('idx_item_status')
  statusId: number | null;

  @ManyToOne(() => Status, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'status_id' })
  status: Status;

  // Barcode
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_item_barcode')
  barcode: string | null;

  // Storage location
  @Column({ name: 'storage_location_id', type: 'int', unsigned: true, nullable: true })
  storageLocationId: number | null;

  @ManyToOne(() => StorageLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'storage_location_id' })
  storageLocation: StorageLocation;

  // User-chosen category IDs (before parent inheritance resolution)
  @Column({ name: 'user_category_ids', type: 'simple-json', nullable: true })
  userCategoryIds: number[] | null;

  // External links from providers (TMDB, TVDB, Amazon, etc.)
  @Column({ name: 'external_links', type: 'simple-json', nullable: true })
  externalLinks: { provider: string; label: string; url: string }[] | null;

  // Categories (many-to-many, includes inherited parents)
  @ManyToMany(() => Category, { cascade: false })
  @JoinTable({
    name: 'item_categories',
    joinColumn: { name: 'item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  // Grades (many-to-many)
  @ManyToMany(() => Grade, { cascade: false })
  @JoinTable({
    name: 'item_grades',
    joinColumn: { name: 'item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'grade_id', referencedColumnName: 'id' },
  })
  grades: Grade[];

  // Metadata (EAV) — primary type level
  @OneToMany(() => ItemMetadata, (meta) => meta.item, { cascade: true })
  metadata: ItemMetadata[];

  // Metadata (EAV) — category level
  @OneToMany(() => ItemCategoryMetadata, (meta) => meta.item, { cascade: true })
  categoryMetadata: ItemCategoryMetadata[];

  // Media relations
  @OneToMany(() => ItemImage, (img) => img.item, { cascade: true })
  images: ItemImage[];

  @OneToMany(() => ItemVideo, (vid) => vid.item, { cascade: true })
  videos: ItemVideo[];

  @OneToMany(() => ItemAudio, (aud) => aud.item, { cascade: true })
  audio: ItemAudio[];

  @OneToMany(() => ItemDocument, (doc) => doc.item, { cascade: true })
  documents: ItemDocument[];

  // Soft delete
  @DeleteDateColumn({ name: 'deleted_at' })
  @Index('idx_item_deleted')
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_item_created')
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
