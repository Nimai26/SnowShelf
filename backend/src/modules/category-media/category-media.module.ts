import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryMediaController } from './category-media.controller';
import { CategoryMediaService } from './category-media.service';
import { CategoryImage } from '../../database/entities/category-image.entity';
import { CategoryVideo } from '../../database/entities/category-video.entity';
import { CategoryAudio } from '../../database/entities/category-audio.entity';
import { CategoryDocument } from '../../database/entities/category-document.entity';
import { UploadConfig } from '../../database/entities/upload-config.entity';
import { Category } from '../../database/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryImage,
      CategoryVideo,
      CategoryAudio,
      CategoryDocument,
      UploadConfig,
      Category,
    ]),
  ],
  controllers: [CategoryMediaController],
  providers: [CategoryMediaService],
  exports: [CategoryMediaService],
})
export class CategoryMediaModule {}
