import apiClient from './api';
import type {
  TakoSearchParams,
  TakoSearchResponse,
  TakoDomainsResponse,
  TakoDetailResponse,
  TakoProxyDownloadResponse,
  TakoHealthResponse,
  TakoProvidersForTypeResponse,
  TakoBarcodeLookupParams,
  TakoBarcodeLookupResponse,
} from '../types/tako.types';

export const takoService = {
  /**
   * Recherche web via Tako_Api
   */
  search: async (params: TakoSearchParams): Promise<TakoSearchResponse> => {
    const response = await apiClient.post('/api/v1/search/web', params, { timeout: 60000 }); // 60s — recherche multi-providers
    return response.data;
  },

  /**
   * Liste des domaines disponibles avec leurs providers
   */
  getDomains: async (): Promise<TakoDomainsResponse> => {
    const response = await apiClient.get('/api/v1/search/web/domains');
    return response.data;
  },

  /**
   * Détails d'un résultat spécifique
   */
  getDetail: async (
    domain: string,
    provider: string,
    sourceId: string,
    type?: string,
  ): Promise<TakoDetailResponse> => {
    const params = type ? `?type=${encodeURIComponent(type)}` : '';
    const response = await apiClient.get(
      `/api/v1/search/web/detail/${domain}/${provider}/${encodeURIComponent(sourceId)}${params}`,
      { timeout: 120000 }, // 120s — Tako detail peut impliquer des retries côté backend
    );
    return response.data;
  },

  /**
   * Télécharge une image depuis un URL externe via le proxy backend
   */
  proxyDownload: async (
    url: string,
    filename?: string,
  ): Promise<TakoProxyDownloadResponse> => {
    const response = await apiClient.post('/api/v1/search/web/proxy-download', {
      url,
      filename,
    }, { timeout: 120000 }); // 120s — gros fichiers (PDFs, vidéos)
    return response.data;
  },

  /**
   * Vérifie le statut de santé de Tako_Api
   */
  healthCheck: async (): Promise<TakoHealthResponse> => {
    const response = await apiClient.get('/api/v1/search/web/health');
    return response.data;
  },

  /**
   * Récupère le mapping domaine → PrimaryType et le mapping des champs métadonnées → EAV fieldKey
   */
  getDomainMapping: async (): Promise<{
    success: boolean;
    data: {
      mappings: Record<string, string>;
      fieldMappings: Record<string, Record<string, string>>;
      categoryFieldMappings: Record<string, Record<string, string>>;
      primaryTypeToDomains: Record<string, string[]>;
    };
  }> => {
    const response = await apiClient.get('/api/v1/search/web/domain-mapping');
    return response.data;
  },

  getProvidersForType: async (typeKey: string): Promise<TakoProvidersForTypeResponse> => {
    const response = await apiClient.get(`/api/v1/search/web/providers-for-type/${typeKey}`);
    return response.data;
  },

  /**
   * Recherche par code-barres / ISBN / EAN
   */
  lookupBarcode: async (params: TakoBarcodeLookupParams): Promise<TakoBarcodeLookupResponse> => {
    const response = await apiClient.post('/api/v1/search/web/barcode', params, { timeout: 60000 });
    return response.data;
  },
};
