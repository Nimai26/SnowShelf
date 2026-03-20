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
import { User } from './user.entity';

@Entity('push_subscriptions')
@Index('idx_push_user', ['userId'])
export class PushSubscription {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** The full endpoint URL for the push service */
  @Column({ type: 'text' })
  endpoint: string;

  /** Unique hash of endpoint for deduplication */
  @Column({ name: 'endpoint_hash', type: 'varchar', length: 64, unique: true })
  endpointHash: string;

  /** p256dh key from the subscription */
  @Column({ name: 'p256dh', type: 'text' })
  p256dh: string;

  /** auth secret from the subscription */
  @Column({ type: 'text' })
  auth: string;

  /** User agent string at subscription time */
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  /** Whether this subscription is still active */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Last time a push was successfully sent to this endpoint */
  @Column({ name: 'last_push_at', type: 'timestamp', nullable: true })
  lastPushAt: Date | null;

  /** Number of consecutive failures */
  @Column({ name: 'failure_count', type: 'int', default: 0 })
  failureCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
