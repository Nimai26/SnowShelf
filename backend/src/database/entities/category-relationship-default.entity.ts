import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('category_relationships_default')
@Unique('unique_default_relationship', ['parentId', 'childId'])
export class CategoryRelationshipDefault {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'parent_id', type: 'int', unsigned: true })
  @Index('idx_crd_parent')
  parentId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @Column({ name: 'child_id', type: 'int', unsigned: true })
  @Index('idx_crd_child')
  childId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
