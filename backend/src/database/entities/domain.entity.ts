import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TakoProvider } from './tako-provider.entity';

@Entity('domains')
export class Domain {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /** Clé technique unique, ex: 'books', 'videogames', 'construction-toys' */
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_name')
  name: string;

  @Column({ name: 'display_name', type: 'varchar', length: 200 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'icon_url', type: 'varchar', length: 500, nullable: true })
  iconUrl: string | null;

  /** Emoji icône pour l'affichage UI */
  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string | null;

  /** Route Tako API, ex: '/api/books' */
  @Column({ name: 'route_path', type: 'varchar', length: 200, nullable: true })
  routePath: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => TakoProvider, (provider) => provider.domain, { cascade: true })
  providers: TakoProvider[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
