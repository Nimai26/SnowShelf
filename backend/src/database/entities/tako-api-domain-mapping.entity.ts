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
import { Domain } from './domain.entity';

@Entity('tako_api_domain_mapping')
@Index('unique_domain_mapping', ['domainId', 'takoDomain'], { unique: true })
@Index('idx_tako_domain', ['takoDomain'])
export class TakoApiDomainMapping {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'domain_id', type: 'int', unsigned: true })
  domainId: number;

  @ManyToOne(() => Domain, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'domain_id' })
  domain: Domain;

  @Column({ name: 'tako_domain', type: 'varchar', length: 100 })
  takoDomain: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
