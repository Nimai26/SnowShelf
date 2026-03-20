import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des amis' })
  @ApiResponse({ status: 200, description: 'Liste des amis' })
  async getFriends(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.friendsService.getFriends(
      user.id,
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Get('requests/received')
  @ApiOperation({ summary: 'Demandes d\'ami reçues' })
  @ApiResponse({ status: 200, description: 'Demandes reçues en attente' })
  async getReceivedRequests(@CurrentUser() user: User) {
    return this.friendsService.getReceivedRequests(user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Demandes d\'ami envoyées' })
  @ApiResponse({ status: 200, description: 'Demandes envoyées en attente' })
  async getSentRequests(@CurrentUser() user: User) {
    return this.friendsService.getSentRequests(user.id);
  }

  @Get('pending-count')
  @ApiOperation({ summary: 'Nombre de demandes en attente' })
  @ApiResponse({ status: 200, description: 'Nombre de demandes' })
  async getPendingCount(@CurrentUser() user: User) {
    const count = await this.friendsService.getPendingCount(user.id);
    return { success: true, data: { count } };
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Statut de relation avec un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur cible' })
  @ApiResponse({ status: 200, description: 'Statut de la relation' })
  async getFriendshipStatus(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) targetId: number,
  ) {
    return this.friendsService.getFriendshipStatus(user.id, targetId);
  }

  @Post('request-by-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer une demande d\'ami par email' })
  @ApiResponse({ status: 200, description: 'Résultat de la demande' })
  async sendRequestByEmail(
    @CurrentUser() user: User,
    @Body('email') email: string,
  ) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: true, data: { result: 'not_found' } };
    }
    return this.friendsService.sendRequestByEmail(user.id, email.trim().toLowerCase());
  }

  @Post('request/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer une demande d\'ami' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur cible' })
  @ApiResponse({ status: 200, description: 'Demande envoyée' })
  async sendRequest(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) addresseeId: number,
  ) {
    return this.friendsService.sendRequest(user.id, addresseeId);
  }

  @Post('accept/:friendshipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepter une demande d\'ami' })
  @ApiParam({ name: 'friendshipId', description: 'ID de l\'amitié' })
  @ApiResponse({ status: 200, description: 'Demande acceptée' })
  async acceptRequest(
    @CurrentUser() user: User,
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
  ) {
    return this.friendsService.acceptRequest(user.id, friendshipId);
  }

  @Post('decline/:friendshipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refuser une demande d\'ami' })
  @ApiParam({ name: 'friendshipId', description: 'ID de l\'amitié' })
  @ApiResponse({ status: 200, description: 'Demande refusée' })
  async declineRequest(
    @CurrentUser() user: User,
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
  ) {
    return this.friendsService.declineRequest(user.id, friendshipId);
  }

  @Post('block/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloquer un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur à bloquer' })
  @ApiResponse({ status: 200, description: 'Utilisateur bloqué' })
  async blockUser(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) targetId: number,
  ) {
    return this.friendsService.blockUser(user.id, targetId);
  }

  @Delete(':friendshipId')
  @ApiOperation({ summary: 'Retirer un ami / annuler une demande / débloquer' })
  @ApiParam({ name: 'friendshipId', description: 'ID de l\'amitié' })
  @ApiResponse({ status: 200, description: 'Relation supprimée' })
  async removeFriendship(
    @CurrentUser() user: User,
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
  ) {
    return this.friendsService.removeFriendship(user.id, friendshipId);
  }
}
