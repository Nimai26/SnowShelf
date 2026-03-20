import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { Category } from '../../database/entities/category.entity';
import { Item } from '../../database/entities/item.entity';
import { Friendship } from '../../database/entities/friendship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Item, Friendship])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
