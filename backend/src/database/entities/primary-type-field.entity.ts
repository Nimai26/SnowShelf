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
import { PrimaryType } from './primary-type.entity';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  YEAR = 'year',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  URL = 'url',
  RATING = 'rating',
  DURATION = 'duration',
  BOOLEAN = 'boolean',
  CHECKLIST = 'checklist',
}

@Entity('primary_type_fields')
@Index('unique_type_field', ['primaryTypeId', 'fieldKey'], { unique: true })
export class PrimaryTypeField {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'primary_type_id', type: 'int', unsigned: true })
  @Index('idx_ptf_type_id')
  primaryTypeId: number;

  @ManyToOne(() => PrimaryType, (pt) => pt.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'primary_type_id' })
  primaryType: PrimaryType;

  @Column({ type: 'varchar', length: 50, name: 'field_key' })
  @Index('idx_ptf_field_key')
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
  @Index('idx_ptf_sort_order')
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
