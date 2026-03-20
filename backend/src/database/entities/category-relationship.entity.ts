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
import { User } from './user.entity';

@Entity('category_relationships')
@Unique('unique_relationship', ['parentId', 'childId', 'userId'])
export class CategoryRelationship {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'parent_id', type: 'int', unsigned: true })
  @Index('idx_cr_parent')
  parentId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @Column({ name: 'child_id', type: 'int', unsigned: true })
  @Index('idx_cr_child')
  childId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: Category;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  @Index('idx_cr_user')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
