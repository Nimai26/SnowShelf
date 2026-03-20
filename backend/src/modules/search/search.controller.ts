import {
  Controller,
  Get,
  Delete,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { GlobalSearchDto, SuggestDto } from './dto/search.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Recherche globale (items + catégories)' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  async globalSearch(
    @CurrentUser() user: User,
    @Query() dto: GlobalSearchDto,
    @Query('lang') lang?: string,
  ) {
    return this.searchService.globalSearch(user.id, dto, lang || 'fr');
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Suggestions de recherche (autocomplete)' })
  @ApiResponse({ status: 200, description: 'Suggestions' })
  async getSuggestions(
    @CurrentUser() user: User,
    @Query() dto: SuggestDto,
  ) {
    return this.searchService.getSuggestions(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique de recherche' })
  @ApiResponse({ status: 200, description: 'Historique' })
  async getHistory(@CurrentUser() user: User) {
    const history = await this.searchService.getHistory(user.id);
    return { success: true, data: history };
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Effacer l\'historique de recherche' })
  @ApiResponse({ status: 200, description: 'Historique effacé' })
  async clearHistory(@CurrentUser() user: User) {
    return this.searchService.clearHistory(user.id);
  }

  @Delete('history/entry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une entrée de l\'historique' })
  @ApiResponse({ status: 200, description: 'Entrée supprimée' })
  async removeHistoryEntry(
    @CurrentUser() user: User,
    @Query('q') query: string,
  ) {
    return this.searchService.removeHistoryEntry(user.id, query);
  }
}
