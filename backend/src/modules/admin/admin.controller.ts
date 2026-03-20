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
}
