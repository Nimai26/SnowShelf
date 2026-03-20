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
import { PrimaryTypeField } from './primary-type-field.entity';

@Entity('item_metadata')
@Index('idx_im_item_field', ['itemId', 'fieldId'])
@Index('unique_item_field', ['itemId', 'fieldId'], { unique: true })
export class ItemMetadata {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'item_id', type: 'int', unsigned: true })
  @Index('idx_im_item')
  itemId: number;

  @ManyToOne(() => Item, (item) => item.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'field_id', type: 'int', unsigned: true })
  @Index('idx_im_field')
  fieldId: number;

  @ManyToOne(() => PrimaryTypeField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'field_id' })
  field: PrimaryTypeField;

  // Typed values — only one will be non-null
  @Column({ type: 'text', name: 'value_text', nullable: true })
  @Index('idx_im_value_text')
  valueText: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'value_number', nullable: true })
  @Index('idx_im_value_number')
  valueNumber: number | null;

  @Column({ type: 'date', name: 'value_date', nullable: true })
  @Index('idx_im_value_date')
  valueDate: Date | null;

  @Column({ type: 'simple-json', name: 'value_json', nullable: true })
  valueJson: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
