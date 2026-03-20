import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tako_api_config')
export class TakoApiConfig {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'api_url', type: 'varchar', length: 500 })
  apiUrl: string;

  @Column({ type: 'int', default: 30000 })
  timeout: number;

  @Column({ name: 'cache_ttl', type: 'int', default: 3600 })
  cacheTtl: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_health_check', type: 'timestamp', nullable: true })
  lastHealthCheck: Date | null;

  @Column({
    name: 'health_status',
    type: 'enum',
    enum: ['healthy', 'degraded', 'down'],
    default: 'healthy',
  })
  healthStatus: 'healthy' | 'degraded' | 'down';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
