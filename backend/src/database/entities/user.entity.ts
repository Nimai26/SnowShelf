import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  FREE = 'free',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

export enum CollectionsVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  FRIENDS = 'friends',
}

export enum FriendRequestPolicy {
  EVERYONE = 'everyone',
  NOBODY = 'nobody',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_username')
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_email')
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FREE })
  @Index('idx_role')
  role: UserRole;

  @Column({ type: 'date', name: 'premium_until', nullable: true })
  premiumUntil: Date | null;

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 64, name: 'email_token', nullable: true })
  @Index('idx_email_token')
  emailToken: string | null;

  @Column({ type: 'timestamp', name: 'email_token_expires', nullable: true })
  emailTokenExpires: Date | null;

  @Column({ type: 'varchar', length: 64, name: 'reset_token', nullable: true })
  @Index('idx_reset_token')
  resetToken: string | null;

  @Column({ type: 'timestamp', name: 'reset_token_expires', nullable: true })
  resetTokenExpires: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'refresh_token_hash', nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', length: 512, name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 512, name: 'background_url', nullable: true })
  backgroundUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 32, default: 'dark' })
  theme: string;

  @Column({ type: 'varchar', length: 5, default: 'fr' })
  lang: string;

  @Column({ type: 'boolean', default: false })
  newsletter: boolean;

  @Column({
    type: 'enum',
    enum: CollectionsVisibility,
    name: 'collections_visibility',
    default: CollectionsVisibility.PRIVATE,
  })
  collectionsVisibility: CollectionsVisibility;

  @Column({ type: 'boolean', name: 'show_email', default: false })
  showEmail: boolean;

  @Column({
    type: 'enum',
    enum: FriendRequestPolicy,
    name: 'friend_request_policy',
    default: FriendRequestPolicy.EVERYONE,
  })
  friendRequestPolicy: FriendRequestPolicy;

  @Column({ type: 'int', unsigned: true, name: 'items_count', default: 0 })
  itemsCount: number;

  @Column({ type: 'int', unsigned: true, name: 'categories_count', default: 0 })
  categoriesCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_value', nullable: true })
  totalValue: number | null;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'timestamp', name: 'last_activity_at', nullable: true })
  lastActivityAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
