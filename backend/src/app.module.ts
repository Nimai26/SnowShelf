import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PrimaryTypesModule } from './modules/primary-types/primary-types.module';
import { ItemsModule } from './modules/items/items.module';
import { StatusesModule } from './modules/statuses/statuses.module';
import { GradesModule } from './modules/grades/grades.module';
import { StorageLocationsModule } from './modules/storage-locations/storage-locations.module';
import { ItemMediaModule } from './modules/item-media/item-media.module';
import { CategoryMediaModule } from './modules/category-media/category-media.module';
import { FileServingModule } from './modules/file-serving/file-serving.module';
import { MailModule } from './modules/mail/mail.module';
import { SearchModule } from './modules/search/search.module';
import { ImageProcessingModule } from './modules/image-processing/image-processing.module';
import { TakoModule } from './modules/tako/tako.module';
import { AdminModule } from './modules/admin/admin.module';
import { FriendsModule } from './modules/friends/friends.module';
import { AdminSeedService } from './database/seeds/admin-seed.service';
import { PrimaryTypeSeedService } from './database/seeds/primary-type-seed.service';
import { CategorySeedService } from './database/seeds/category-seed.service';
import { StatusSeedService } from './database/seeds/status-seed.service';
import { GradeSeedService } from './database/seeds/grade-seed.service';
import { UploadConfigSeedService } from './database/seeds/upload-config-seed.service';
import { DomainProviderSeedService } from './database/seeds/domain-provider-seed.service';
import { TcgCategorySeedService } from './database/seeds/tcg-category-seed.service';
import { CategoryField } from './database/entities/category-field.entity';
import { CategoryRelationshipDefault } from './database/entities/category-relationship-default.entity';
import { User } from './database/entities/user.entity';
import { Category } from './database/entities/category.entity';
import { PrimaryType } from './database/entities/primary-type.entity';
import { PrimaryTypeField } from './database/entities/primary-type-field.entity';
import { Status } from './database/entities/status.entity';
import { Grade } from './database/entities/grade.entity';
import { UploadConfig } from './database/entities/upload-config.entity';
import { Domain } from './database/entities/domain.entity';
import { TakoProvider } from './database/entities/tako-provider.entity';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env', // Commenté car les variables sont définies via docker-compose
    }),

    // Rate Limiting global (100 req / 60s)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'redis'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD', ''),
        db: configService.get('REDIS_DB', 0),
        ttl: 300, // 5 min par défaut
      }),
    }),

    // TypeORM avec MariaDB
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        timezone: '+00:00',
      }),
    }),

    // Modules fonctionnels
    TypeOrmModule.forFeature([User, Category, PrimaryType, PrimaryTypeField, Status, Grade, UploadConfig, Domain, TakoProvider, CategoryField, CategoryRelationshipDefault]),
    MailModule,
    AuthModule,
    UsersModule,
    NotificationsModule,
    CategoriesModule,
    PrimaryTypesModule,
    ItemsModule,
    StatusesModule,
    GradesModule,
    StorageLocationsModule,
    ItemMediaModule,
    CategoryMediaModule,
    FileServingModule,
    SearchModule,
    ImageProcessingModule,
    TakoModule,
    AdminModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminSeedService,
    PrimaryTypeSeedService,
    CategorySeedService,
    StatusSeedService,
    GradeSeedService,
    UploadConfigSeedService,
    DomainProviderSeedService,
    TcgCategorySeedService,
    // Guards globaux (JwtAuth puis Roles)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
