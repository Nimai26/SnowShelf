import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('statuses')
export class Status {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  @Index('idx_status_user')
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 7, default: '#6b7280' })
  color: string;

  @Column({ type: 'varchar', length: 50, default: 'tag' })
  icon: string;

  @Column({ type: 'int', default: 0 })
  @Index('idx_status_ordre')
  ordre: number;

  @Column({ type: 'tinyint', default: 0 })
  @Index('idx_status_defaut')
  defaut: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
