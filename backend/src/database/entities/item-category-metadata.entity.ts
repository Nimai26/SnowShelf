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
import { Item } from './item.entity';
import { CategoryField } from './category-field.entity';

@Entity('item_category_metadata')
@Index('idx_icm_item_field', ['itemId', 'fieldId'])
@Index('unique_item_catfield', ['itemId', 'fieldId'], { unique: true })
export class ItemCategoryMetadata {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'item_id', type: 'int', unsigned: true })
  @Index('idx_icm_item')
  itemId: number;

  @ManyToOne(() => Item, (item) => item.categoryMetadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'field_id', type: 'int', unsigned: true })
  @Index('idx_icm_field')
  fieldId: number;

  @ManyToOne(() => CategoryField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'field_id' })
  field: CategoryField;

  // Typed values — only one will be non-null
  @Column({ type: 'text', name: 'value_text', nullable: true })
  @Index('idx_icm_value_text')
  valueText: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'value_number', nullable: true })
  @Index('idx_icm_value_number')
  valueNumber: number | null;

  @Column({ type: 'date', name: 'value_date', nullable: true })
  @Index('idx_icm_value_date')
  valueDate: Date | null;

  @Column({ type: 'simple-json', name: 'value_json', nullable: true })
  valueJson: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
