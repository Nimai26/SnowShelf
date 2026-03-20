import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { FieldType } from './primary-type-field.entity';

@Entity('category_fields')
@Index('unique_category_field', ['categoryId', 'fieldKey'], { unique: true })
export class CategoryField {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'category_id', type: 'int', unsigned: true })
  @Index('idx_cf_category_id')
  categoryId: number;

  @ManyToOne(() => Category, (cat) => cat.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'varchar', length: 50, name: 'field_key' })
  @Index('idx_cf_field_key')
  fieldKey: string;

  @Column({ type: 'varchar', length: 100, name: 'field_name_fr' })
  fieldNameFr: string;

  @Column({ type: 'varchar', length: 100, name: 'field_name_en' })
  fieldNameEn: string;

  @Column({
    type: 'enum',
    enum: FieldType,
    name: 'field_type',
    default: FieldType.TEXT,
  })
  fieldType: FieldType;

  @Column({ type: 'simple-json', name: 'field_options', nullable: true })
  fieldOptions: any | null;

  @Column({ type: 'varchar', length: 200, name: 'placeholder_fr', nullable: true })
  placeholderFr: string | null;

  @Column({ type: 'varchar', length: 200, name: 'placeholder_en', nullable: true })
  placeholderEn: string | null;

  @Column({ type: 'text', name: 'help_text_fr', nullable: true })
  helpTextFr: string | null;

  @Column({ type: 'text', name: 'help_text_en', nullable: true })
  helpTextEn: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string | null;

  @Column({ type: 'boolean', name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ type: 'boolean', name: 'is_searchable', default: true })
  isSearchable: boolean;

  @Column({ type: 'boolean', name: 'is_filterable', default: true })
  isFilterable: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  @Index('idx_cf_sort_order')
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
