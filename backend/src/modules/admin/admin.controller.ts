import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ──── Dashboard ────

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.adminService.getRecentActivity(limit ? parseInt(limit, 10) : 20);
  }

  // ──── Users ────

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('sort') sort?: 'createdAt' | 'username' | 'itemsCount',
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      role,
      sort || 'createdAt',
      order || 'DESC',
    );
  }

  @Put('users/:id/role')
  changeUserRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('role') newRole: UserRole,
  ) {
    return this.adminService.changeUserRole(req.user.id, id, newRole);
  }

  @Delete('users/:id')
  deleteUser(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(req.user.id, id);
  }

  // ──── System notifications ────

  @Post('notifications/broadcast')
  sendSystemNotification(
    @Body('title') title: string,
    @Body('message') message: string,
  ) {
    return this.adminService.sendSystemNotification(title, message);
  }

  // ──── Newsletters ────

  @Get('newsletters')
  getNewsletters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getNewsletters(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('newsletters/:id')
  getNewsletter(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getNewsletterById(id);
  }

  @Post('newsletters')
  createNewsletter(
    @Req() req: any,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('targetAudience') targetAudience?: string,
  ) {
    return this.adminService.createNewsletter(req.user.id, title, content, targetAudience as any);
  }

  @Put('newsletters/:id')
  updateNewsletter(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title?: string,
    @Body('content') content?: string,
    @Body('targetAudience') targetAudience?: string,
  ) {
    return this.adminService.updateNewsletter(id, title, content, targetAudience as any);
  }

  @Delete('newsletters/:id')
  deleteNewsletter(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteNewsletter(id);
  }

  @Post('newsletters/:id/publish')
  publishNewsletter(
    @Param('id', ParseIntPipe) id: number,
    @Body('sendNotification') sendNotification: boolean,
    @Body('sendEmail') sendEmail: boolean,
  ) {
    return this.adminService.publishNewsletter(id, sendNotification ?? false, sendEmail ?? false);
  }
}

// ──── Public endpoint for published newsletters ────

@Controller('newsletters')
export class NewslettersPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get()
  getPublishedNewsletters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPublishedNewsletters(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
