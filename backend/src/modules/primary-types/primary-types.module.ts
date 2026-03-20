import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { PrimaryTypeField } from '../../database/entities/primary-type-field.entity';
import { PrimaryTypesService } from './primary-types.service';
import { PrimaryTypesController } from './primary-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrimaryType, PrimaryTypeField])],
  controllers: [PrimaryTypesController],
  providers: [PrimaryTypesService],
  exports: [PrimaryTypesService],
})
export class PrimaryTypesModule {}
