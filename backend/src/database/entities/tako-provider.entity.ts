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

@Entity('tako_providers')
@Index('unique_domain_provider', ['domainId', 'key'], { unique: true })
export class TakoProvider {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'domain_id', type: 'int', unsigned: true })
  domainId: number;

  @ManyToOne(() => Domain, (domain) => domain.providers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'domain_id' })
  domain: Domain;

  /** Clé technique du provider, ex: 'igdb', 'rawg', 'googlebooks' */
  @Column({ type: 'varchar', length: 100 })
  @Index('idx_provider_key')
  key: string;

  @Column({ name: 'display_name', type: 'varchar', length: 200 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Segment intermédiaire pour l'URL de détail Tako.
   * Ex: 'game' pour igdb → /api/videogames/igdb/game/{id}
   * null → pas de segment intermédiaire → /api/books/googlebooks/{id}
   */
  @Column({ name: 'detail_segment', type: 'varchar', length: 100, nullable: true })
  detailSegment: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
