import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { PrimaryTypeField } from './primary-type-field.entity';
import { Domain } from './domain.entity';

@Entity('primary_types')
export class PrimaryType {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'key_name' })
  @Index('idx_pt_key_name')
  keyName: string;

  @Column({ type: 'varchar', length: 100, name: 'name_fr' })
  nameFr: string;

  @Column({ type: 'varchar', length: 100, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 10 })
  icon: string;

  @Column({ type: 'varchar', length: 7, default: '#3498db' })
  color: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  @Index('idx_pt_sort_order')
  sortOrder: number;

  @OneToMany(() => PrimaryTypeField, (field) => field.primaryType, { cascade: true })
  fields: PrimaryTypeField[];

  /** Domaines Tako associés à ce type d'objet */
  @ManyToMany(() => Domain, { eager: false })
  @JoinTable({
    name: 'primary_type_domains',
    joinColumn: { name: 'primary_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'domain_id', referencedColumnName: 'id' },
  })
  domains: Domain[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
