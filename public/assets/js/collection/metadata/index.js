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
    buildSpecialStickersGridsHtml,
    buildTracklistHtml,
    refreshStickerGrid,
    initStickerGridEvents,
    initSpecialStickersGridEvents,
    initTracklistEvents,
    initMetadataDropdowns,
    applyImportedMetadata,
    collectMetadataValues
} from './fields.js';
