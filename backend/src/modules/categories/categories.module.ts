import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../database/entities/category.entity';
import { CategoryRelationship } from '../../database/entities/category-relationship.entity';
import { CategoryRelationshipDefault } from '../../database/entities/category-relationship-default.entity';
import { CategoryImage } from '../../database/entities/category-image.entity';
import { CategoryVideo } from '../../database/entities/category-video.entity';
import { CategoryAudio } from '../../database/entities/category-audio.entity';
import { CategoryDocument } from '../../database/entities/category-document.entity';
import { CategoryField } from '../../database/entities/category-field.entity';
import { User } from '../../database/entities/user.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Item } from '../../database/entities/item.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      CategoryRelationship,
      CategoryRelationshipDefault,
      CategoryImage,
      CategoryVideo,
      CategoryAudio,
      CategoryDocument,
      CategoryField,
      User,
      Grade,
      Item,
      PrimaryType,
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
