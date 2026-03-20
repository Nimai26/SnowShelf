import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemMediaController } from './item-media.controller';
import { ItemMediaService } from './item-media.service';
import { ItemImage } from '../../database/entities/item-image.entity';
import { ItemVideo } from '../../database/entities/item-video.entity';
import { ItemAudio } from '../../database/entities/item-audio.entity';
import { ItemDocument } from '../../database/entities/item-document.entity';
import { UploadConfig } from '../../database/entities/upload-config.entity';
import { Item } from '../../database/entities/item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ItemImage,
      ItemVideo,
      ItemAudio,
      ItemDocument,
      UploadConfig,
      Item,
    ]),
  ],
  controllers: [ItemMediaController],
  providers: [ItemMediaService],
  exports: [ItemMediaService],
})
export class ItemMediaModule {}
