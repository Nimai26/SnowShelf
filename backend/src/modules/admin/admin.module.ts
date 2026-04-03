import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController, NewslettersPublicController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { Item } from '../../database/entities/item.entity';
import { Category } from '../../database/entities/category.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Newsletter } from '../../database/entities/newsletter.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Item, Category, Notification, Newsletter]),
    NotificationsModule,
  ],
  controllers: [AdminController, NewslettersPublicController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
