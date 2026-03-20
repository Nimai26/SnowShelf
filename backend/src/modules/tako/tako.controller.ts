import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TakoService } from './tako.service';
import { TAKO_FIELD_MAPPING, TAKO_CATEGORY_FIELD_MAPPING } from './tako.service';
import { TakoSearchDto, ProxyDownloadDto, TakoBarcodeLookupDto } from './dto/tako.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class TakoController {
  constructor(private readonly takoService: TakoService) {}

  // ──────────────────────────────────────────────
  // DOMAINS
  // ──────────────────────────────────────────────

  @Get('web/domains')
  @ApiOperation({ summary: 'Liste des domaines Tako_Api disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des domaines avec providers' })
  async getDomains() {
    const domains = await this.takoService.getDomains();
    return {
      success: true,
      data: { domains },
    };
  }

  // ──────────────────────────────────────────────
  // SEARCH
  // ──────────────────────────────────────────────

  @Post('web')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recherche web via Tako_Api' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche normalisés' })
  async search(@Body() dto: TakoSearchDto) {
    const results = await this.takoService.search(dto);
    return {
      success: true,
      data: results,
    };
  }

  // ──────────────────────────────────────────────
  // BARCODE LOOKUP
  // ──────────────────────────────────────────────

  @Post('web/barcode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recherche par code-barres / ISBN / EAN' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche par code-barres' })
  async lookupBarcode(@Body() dto: TakoBarcodeLookupDto) {
    const results = await this.takoService.lookupBarcode(dto.barcode, dto.domains);
    return {
      success: true,
      data: results,
    };
  }

  // ──────────────────────────────────────────────
  // DETAIL
  // ──────────────────────────────────────────────

  @Get('web/detail/:domain/:provider/*')
  @ApiOperation({ summary: 'Détails d\'un résultat Tako_Api' })
  @ApiResponse({ status: 200, description: 'Détails complets' })
  async getDetail(
    @Param('domain') domain: string,
    @Param('provider') provider: string,
    @Param('0') sourceIdRaw: string,
    @Query('type') type?: string,
  ) {
    // sourceId may contain slashes (e.g. Lorcana "40/204 • EN • 1")
    const sourceId = decodeURIComponent(sourceIdRaw);
    const detail = await this.takoService.getDetail(domain, provider, sourceId, type);
    return {
      success: true,
      data: detail,
    };
  }

  // ──────────────────────────────────────────────
  // HEALTH STATUS
  // ──────────────────────────────────────────────

  @Get('web/health')
  @ApiOperation({ summary: 'Statut de santé Tako_Api' })
  @ApiResponse({ status: 200, description: 'Statut de santé' })
  async healthCheck() {
    const health = await this.takoService.healthCheck();
    return {
      success: true,
      data: health,
    };
  }

  // ──────────────────────────────────────────────
  // PROXY DOWNLOAD (import image from external URL)
  // ──────────────────────────────────────────────

  @Post('web/proxy-download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Télécharger une image depuis une URL externe' })
  @ApiResponse({ status: 200, description: 'Image téléchargée' })
  async proxyDownload(
    @CurrentUser() user: User,
    @Body() dto: ProxyDownloadDto,
  ) {
    const result = await this.takoService.proxyDownload(
      dto.url,
      user.id,
      dto.filename,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ──────────────────────────────────────────────
  // DOMAIN → PRIMARY TYPE MAPPING
  // ──────────────────────────────────────────────

  @Get('web/domain-mapping')
  @ApiOperation({
    summary: 'Mapping domaine Tako → PrimaryType et mapping champs métadonnées → EAV fieldKey',
  })
  @ApiResponse({ status: 200, description: 'Mappings domaine et champs' })
  async getDomainMapping() {
    const [mappings, primaryTypeToDomains] = await Promise.all([
      this.takoService.getDomainToPrimaryTypeMap(),
      this.takoService.getPrimaryTypeToDomainMap(),
    ]);
    return {
      success: true,
      data: {
        mappings,
        fieldMappings: TAKO_FIELD_MAPPING,
        categoryFieldMappings: TAKO_CATEGORY_FIELD_MAPPING,
        primaryTypeToDomains,
      },
    };
  }

  // ──────────────────────────────────────────────
  // PROVIDERS PAR TYPE D'OBJET
  // ──────────────────────────────────────────────

  @Get('web/providers-for-type/:typeKey')
  @ApiOperation({
    summary: "Retourne les domaines et providers Tako disponibles pour un type d'objet",
  })
  @ApiResponse({ status: 200, description: 'Domaines et providers' })
  async getProvidersForType(@Param('typeKey') typeKey: string) {
    const providers = await this.takoService.getProvidersForPrimaryType(typeKey);
    return {
      success: true,
      data: providers,
    };
  }
}
