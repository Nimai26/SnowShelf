import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Request } from 'express';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les notifications' })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findAllForUser(
      user.id,
      page || 1,
      limit || 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { success: true, data: { count } };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une notification' })
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.delete(user.id, id);
  }

  // ──────────────────────────────────────────────
  // PUSH NOTIFICATIONS
  // ──────────────────────────────────────────────

  @Get('push/vapid-key')
  @ApiOperation({ summary: 'Obtenir la clé publique VAPID' })
  @ApiResponse({ status: 200, description: 'Clé VAPID publique' })
  getVapidKey() {
    return {
      success: true,
      data: { publicKey: this.pushService.getVapidPublicKey() },
    };
  }

  @Post('push/subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer une souscription push' })
  async pushSubscribe(
    @CurrentUser() user: User,
    @Body()
    body: {
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
    },
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || null;
    const sub = await this.pushService.subscribe(
      user.id,
      body.subscription,
      userAgent,
    );
    return {
      success: true,
      data: { id: sub.id, message: 'Push subscription registered' },
    };
  }

  @Post('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une souscription push' })
  async pushUnsubscribe(
    @CurrentUser() user: User,
    @Body() body: { endpoint: string },
  ) {
    await this.pushService.unsubscribe(user.id, body.endpoint);
    return { success: true, data: { message: 'Push subscription removed' } };
  }

  @Get('push/status')
  @ApiOperation({ summary: 'Statut des souscriptions push' })
  async pushStatus(@CurrentUser() user: User) {
    const count = await this.pushService.getSubscriptionCount(user.id);
    return {
      success: true,
      data: { subscriptionCount: count, pushEnabled: count > 0 },
    };
  }
}
