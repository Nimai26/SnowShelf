/**
 * SnowShelf - Collection Module
 * metadata/index.js - Point d'entrée pour les métadonnées
 */

export {

    parseChecklistString,
    normalizeFieldValue,
    loadMetadataFields,
    renderMetadataFields,
    buildStickerGridHtml,
    refreshStickerGrid,
    initStickerGridEvents,
    initMetadataDropdowns,
    applyImportedMetadata,
    collectMetadataValues
} from './fields.js';
