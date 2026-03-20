import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les grades accessibles' })
  @ApiResponse({ status: 200, description: 'Liste des grades' })
  async findAll(@CurrentUser() user: User) {
    return this.gradesService.findAll(user.id);
  }

  @Get('by-categories')
  @ApiOperation({ summary: 'Grades associés à un ensemble de catégories (union)' })
  @ApiResponse({ status: 200, description: 'Grades par catégories' })
  async findByCategories(
    @CurrentUser() user: User,
    @Query('categoryIds') categoryIdsStr: string,
  ) {
    const categoryIds = categoryIdsStr
      ? categoryIdsStr.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
      : [];
    return this.gradesService.findByCategories(user.id, categoryIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un grade' })
  @ApiResponse({ status: 200, description: 'Détails du grade' })
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un grade personnalisé (Premium/Admin)' })
  @ApiResponse({ status: 201, description: 'Grade créé' })
  async create(@CurrentUser() user: User, @Body() dto: CreateGradeDto) {
    return this.gradesService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un grade personnel' })
  @ApiResponse({ status: 200, description: 'Grade modifié' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un grade personnel' })
  @ApiResponse({ status: 200, description: 'Grade supprimé' })
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.gradesService.remove(user.id, id);
  }
}
