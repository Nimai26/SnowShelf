import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from '../../database/entities/item.entity';
import { ItemMetadata } from '../../database/entities/item-metadata.entity';
import { CategoryField } from '../../database/entities/category-field.entity';
import { ItemCategoryMetadata } from '../../database/entities/item-category-metadata.entity';
import { Category } from '../../database/entities/category.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { PrimaryTypeField } from '../../database/entities/primary-type-field.entity';
import { User } from '../../database/entities/user.entity';
import { Status } from '../../database/entities/status.entity';
import { Grade } from '../../database/entities/grade.entity';
import { StorageLocation } from '../../database/entities/storage-location.entity';
import { CategoryRelationship } from '../../database/entities/category-relationship.entity';
import { CategoryRelationshipDefault } from '../../database/entities/category-relationship-default.entity';
import { ItemImage } from '../../database/entities/item-image.entity';
import { ItemVideo } from '../../database/entities/item-video.entity';
import { ItemAudio } from '../../database/entities/item-audio.entity';
import { ItemDocument } from '../../database/entities/item-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item,
      ItemMetadata,
      CategoryField,
      ItemCategoryMetadata,
      Category,
      PrimaryType,
      PrimaryTypeField,
      User,
      Status,
      Grade,
      StorageLocation,
      CategoryRelationship,
      CategoryRelationshipDefault,
      ItemImage,
      ItemVideo,
      ItemAudio,
      ItemDocument,
    ]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
