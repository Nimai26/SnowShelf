import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Item } from '../../database/entities/item.entity';
import { Category } from '../../database/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, Category]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
