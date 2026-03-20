import { Module } from '@nestjs/common';
import { FileServingController } from './file-serving.controller';

@Module({
  controllers: [FileServingController],
})
export class FileServingModule {}
