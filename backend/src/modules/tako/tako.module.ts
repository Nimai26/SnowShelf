import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TakoController } from './tako.controller';
import { TakoService } from './tako.service';
import { AdminTakoController } from './admin-tako.controller';
import { AdminTakoService } from './admin-tako.service';
import { TakoApiConfig } from '../../database/entities/tako-api-config.entity';
import { TakoApiDomainMapping } from '../../database/entities/tako-api-domain-mapping.entity';
import { Domain } from '../../database/entities/domain.entity';
import { TakoProvider } from '../../database/entities/tako-provider.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TakoApiConfig, TakoApiDomainMapping, Domain, TakoProvider, PrimaryType]),
  ],
  controllers: [TakoController, AdminTakoController],
  providers: [TakoService, AdminTakoService],
  exports: [TakoService, AdminTakoService],
})
export class TakoModule {}
