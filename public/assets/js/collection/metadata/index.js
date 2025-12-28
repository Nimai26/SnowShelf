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
    buildTracklistHtml,
    refreshStickerGrid,
    initStickerGridEvents,
    initTracklistEvents,
    initMetadataDropdowns,
    applyImportedMetadata,
    collectMetadataValues
} from './fields.js';
