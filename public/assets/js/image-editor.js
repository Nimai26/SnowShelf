/**
 * ImageEditor - Éditeur d'images avec recadrage, filtres et transformations
 * 
 * Éditeur complet permettant de modifier une image (rotation, zoom, miroir,
 * recadrage libre, luminosité, contraste, saturation) avant de l'enregistrer.
 * 
 * Utilise ModalManager pour l'affichage.
 * Compatible avec le système i18n et les thèmes SnowShelf.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const ImageEditor = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        minZoom: 0.1,
        maxZoom: 10,
        zoomStep: 0.1,
        zoomWheelFactor: 0.002,
        maxOutputSize: 5000,        // Taille max de sortie en pixels
        outputQualityJpeg: 0.92,
        outputQualityWebp: 0.92,
        previewSize: 80,            // Taille de l'aperçu
        cropHandleSize: 12,         // Taille des poignées de recadrage
        minCropSize: 50,            // Taille minimum du recadrage
    };

    // === ÉTAT ===
    let currentState = null;
    let currentModalId = null;
    let canvas = null;
    let ctx = null;
    let previewCanvas = null;
    let previewCtx = null;
    let image = null;
    let originalImageData = null;   // Données originales pour les filtres
    
    // Transformations
    let zoom = 1;
    let rotation = 0;               // En degrés (0, 90, 180, 270)
    let flipH = false;
    let flipV = false;
    let panX = 0;
    let panY = 0;
    
    // Filtres
    let brightness = 0;             // -100 à +100
    let contrast = 0;               // -100 à +100
    let saturation = 0;             // -100 à +100
    
    // Recadrage
    let cropMode = false;           // Mode recadrage actif
    let cropRect = null;            // { x, y, width, height } en coordonnées canvas
    let cropDragging = false;
    let cropResizing = false;
    let cropHandle = null;          // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w', 'move'
    let cropStartX = 0;
    let cropStartY = 0;
    let cropStartRect = null;
    
    // Interaction
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;

    // === TRADUCTIONS ===
    let translations = {};

    // === ICÔNES SVG ===
    const ICONS = {
        rotateLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>',
        rotateRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>',
        flipH: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M16 7l4 5-4 5M8 7l-4 5 4 5"/></svg>',
        flipV: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M7 8l5-4 5 4M7 16l5 4 5-4"/></svg>',
        zoomIn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        zoomOut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
        crop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v4M6 12v8M2 6h4m8 0h8M18 6v6m0 4v6M6 18h8"/></svg>',
        brightness: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
        contrast: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z"/></svg>',
        saturation: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    };

    // === TEMPLATE DU MODAL ===
    function getModalContent() {
        const t = translations;
        return `
            <div class="image-editor">
                <!-- Zone de canvas principale -->
                <div class="image-editor-canvas-container" id="imageEditorCanvasContainer">
                    <canvas id="imageEditorCanvas"></canvas>
                    
                    <!-- Overlay de prévisualisation -->
                    <div class="image-editor-preview-overlay" id="imageEditorPreviewOverlay">
                        <div class="preview-frame">
                            <canvas id="imageEditorPreview" width="${CONFIG.previewSize}" height="${CONFIG.previewSize}"></canvas>
                        </div>
                        <span class="preview-label">${t.preview || 'Aperçu'}</span>
                    </div>
                    
                    <!-- Indicateur de mode -->
                    <div class="image-editor-mode-indicator" id="imageModeIndicator">
                        <span class="mode-icon">${ICONS.crop}</span>
                        <span class="mode-text">${t.crop_mode || 'Mode recadrage'}</span>
                    </div>
                    
                    <!-- Indicateurs de hint -->
                    <div class="image-editor-hints">
                        <span class="hint-drag">${t.drag_hint || 'Glissez pour déplacer'}</span>
                        <span class="hint-zoom">${t.zoom_hint || 'Molette ou pincement pour zoomer'}</span>
                    </div>
                </div>
                
                <!-- Panneau des filtres -->
                <div class="image-editor-filters" id="imageEditorFilters">
                    <div class="filter-group">
                        <label>
                            <span class="filter-icon">${ICONS.brightness}</span>
                            <span class="filter-name">${t.brightness || 'Luminosité'}</span>
                            <span class="filter-value" id="brightnessValue">0</span>
                        </label>
                        <input type="range" id="brightnessSlider" min="-100" max="100" value="0">
                    </div>
                    <div class="filter-group">
                        <label>
                            <span class="filter-icon">${ICONS.contrast}</span>
                            <span class="filter-name">${t.contrast || 'Contraste'}</span>
                            <span class="filter-value" id="contrastValue">0</span>
                        </label>
                        <input type="range" id="contrastSlider" min="-100" max="100" value="0">
                    </div>
                    <div class="filter-group">
                        <label>
                            <span class="filter-icon">${ICONS.saturation}</span>
                            <span class="filter-name">${t.saturation || 'Saturation'}</span>
                            <span class="filter-value" id="saturationValue">0</span>
                        </label>
                        <input type="range" id="saturationSlider" min="-100" max="100" value="0">
                    </div>
                </div>
                
                <!-- Barre d'outils -->
                <div class="image-editor-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="image-editor-btn" data-action="rotate-left" title="${t.rotate_left || 'Rotation gauche'}">
                            ${ICONS.rotateLeft}
                        </button>
                        <button type="button" class="image-editor-btn" data-action="rotate-right" title="${t.rotate_right || 'Rotation droite'}">
                            ${ICONS.rotateRight}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="image-editor-btn" data-action="flip-h" title="${t.flip_horizontal || 'Miroir horizontal'}">
                            ${ICONS.flipH}
                        </button>
                        <button type="button" class="image-editor-btn" data-action="flip-v" title="${t.flip_vertical || 'Miroir vertical'}">
                            ${ICONS.flipV}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="image-editor-btn" data-action="zoom-out" title="${t.zoom_out || 'Zoom -'}">
                            ${ICONS.zoomOut}
                        </button>
                        <span class="zoom-indicator" id="imageZoomIndicator">100%</span>
                        <button type="button" class="image-editor-btn" data-action="zoom-in" title="${t.zoom_in || 'Zoom +'}">
                            ${ICONS.zoomIn}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="image-editor-btn crop-toggle" data-action="crop" title="${t.crop || 'Recadrage'}">
                            ${ICONS.crop}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="image-editor-btn" data-action="reset" title="${t.reset || 'Réinitialiser'}">
                            ${ICONS.reset}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // === INITIALISATION ===

    /**
     * Ouvre l'éditeur d'image
     * @param {Object} options - Options de configuration
     * @param {string|File|Blob} options.image - Image source (URL, File ou Blob)
     * @param {string} options.caller - Identifiant du modal appelant
     * @param {string} options.targetField - Champ de destination (pour info)
     * @param {string} options.outputFormat - Format de sortie forcé ('image/png', 'image/jpeg', 'image/webp') ou null pour auto
     * @param {Function} options.onSave - Callback appelé avec { blob, tempPath, filename }
     * @param {Function} options.onCancel - Callback appelé si annulé
     * @param {Object} options.translations - Traductions personnalisées
     */
    function open(options = {}) {
        // Charger les traductions depuis i18n si disponible
        if (typeof window.__ === 'function') {
            translations = {
                title: __('image_editor.title'),
                rotate_left: __('image_editor.rotate_left'),
                rotate_right: __('image_editor.rotate_right'),
                flip_horizontal: __('image_editor.flip_horizontal'),
                flip_vertical: __('image_editor.flip_vertical'),
                zoom_in: __('image_editor.zoom_in'),
                zoom_out: __('image_editor.zoom_out'),
                reset: __('image_editor.reset'),
                crop: __('image_editor.crop'),
                crop_mode: __('image_editor.crop_mode'),
                brightness: __('image_editor.brightness'),
                contrast: __('image_editor.contrast'),
                saturation: __('image_editor.saturation'),
                cancel: __('common.cancel'),
                save: __('common.save'),
                preview: __('image_editor.preview'),
                drag_hint: __('image_editor.drag_hint'),
                zoom_hint: __('image_editor.zoom_hint'),
                loading: __('common.loading'),
                error_load: __('image_editor.error_load'),
                error_save: __('image_editor.error_save'),
                processing: __('image_editor.processing'),
            };
        }
        
        // Fusionner avec les traductions personnalisées
        if (options.translations) {
            translations = { ...translations, ...options.translations };
        }

        // Réinitialiser l'état
        resetState();
        
        currentState = {
            caller: options.caller || null,
            targetField: options.targetField || null,
            outputFormat: options.outputFormat || null,
            onSave: options.onSave || null,
            onCancel: options.onCancel || null,
            imageSource: options.image || null,
            originalFormat: null,
            originalFilename: null,
        };

        // Extraire le nom de fichier si c'est un File
        if (options.image instanceof File) {
            currentState.originalFilename = options.image.name;
        }

        // Ouvrir le modal
        currentModalId = ModalManager.open({
            title: translations.title || 'Éditeur d\'image',
            content: getModalContent(),
            size: 'modal-lg',
            customClass: 'modal-image-editor',
            closeOnOverlay: false,
            closeOnEscape: false,
            showFooter: true,
            buttons: [
                { text: translations.cancel || 'Annuler', action: 'cancel', class: 'btn-secondary' },
                { text: translations.save || 'Enregistrer', action: 'save', class: 'btn-primary' }
            ],
            onOpen: (id) => {
                initializeEditor();
                loadImage(currentState.imageSource);
            },
            onClose: (reason) => {
                cleanup();
            }
        });

        // Attacher les événements après ouverture
        setTimeout(() => {
            attachButtonEvents();
            attachFilterEvents();
        }, 50);

        return currentModalId;
    }

    /**
     * Réinitialise l'état des transformations
     */
    function resetState() {
        zoom = 1;
        rotation = 0;
        flipH = false;
        flipV = false;
        panX = 0;
        panY = 0;
        brightness = 0;
        contrast = 0;
        saturation = 0;
        cropMode = false;
        cropRect = null;
        isDragging = false;
        cropDragging = false;
        cropResizing = false;
        isSaving = false; // Reset du flag de sauvegarde
    }

    /**
     * Initialise le canvas et les événements
     */
    function initializeEditor() {
        canvas = document.getElementById('imageEditorCanvas');
        ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
        previewCanvas = document.getElementById('imageEditorPreview');
        previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

        if (!canvas || !ctx) {
            console.error('ImageEditor: Canvas non trouvé');
            return;
        }

        // Dimensionner le canvas à la taille du conteneur
        const container = document.getElementById('imageEditorCanvasContainer');
        if (container) {
            resizeCanvas(container);
        }

        // Événements du canvas
        attachCanvasEvents();

        // Observer le redimensionnement
        if (container && window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                resizeCanvas(container);
                render();
            });
            resizeObserver.observe(container);
        }
    }

    /**
     * Redimensionne le canvas
     */
    function resizeCanvas(container) {
        if (!canvas) return;
        
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Dimensions CSS
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        // Dimensions réelles (haute résolution)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Mise à l'échelle du contexte
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    /**
     * Charge l'image source
     */
    function loadImage(source) {
        if (!source) {
            console.error('ImageEditor: Aucune image source');
            return;
        }

        // Afficher le loading
        const container = document.getElementById('imageEditorCanvasContainer');
        if (container) container.classList.add('loading');

        image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            if (container) container.classList.remove('loading');
            
            // Détecter le format original
            detectOriginalFormat(source);
            
            // Centrer l'image et ajuster le zoom initial
            fitImageToCanvas();
            
            // Initialiser le recadrage à la taille de l'image
            initializeCropRect();
            
            render();
            updatePreview();
        };

        image.onerror = () => {
            if (container) container.classList.remove('loading');
            console.error('ImageEditor: Erreur de chargement de l\'image');
            if (typeof showToast === 'function') {
                showToast(translations.error_load || 'Erreur de chargement', 'error');
            }
        };

        // Charger selon le type de source
        if (source instanceof File || source instanceof Blob) {
            currentState.originalFormat = source.type;
            image.src = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
            image.src = source;
        }
    }

    /**
     * Détecte le format original de l'image
     */
    function detectOriginalFormat(source) {
        if (source instanceof File || source instanceof Blob) {
            currentState.originalFormat = source.type;
        } else if (typeof source === 'string') {
            // Détecter depuis l'extension
            const ext = source.split('.').pop().toLowerCase().split('?')[0];
            const mimeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'svg': 'image/svg+xml'
            };
            currentState.originalFormat = mimeMap[ext] || 'image/png';
        }
    }

    /**
     * Initialise le rectangle de recadrage à la taille de l'image
     */
    function initializeCropRect() {
        if (!image || !canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        
        // Calculer les dimensions de l'image affichée
        const imgW = image.width * zoom;
        const imgH = image.height * zoom;
        
        // Centrer le recadrage
        const x = (canvasW - imgW) / 2 + panX;
        const y = (canvasH - imgH) / 2 + panY;
        
        cropRect = {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(imgW, canvasW),
            height: Math.min(imgH, canvasH)
        };
    }

    /**
     * Ajuste le zoom pour que l'image soit entièrement visible
     */
    function fitImageToCanvas() {
        if (!image || !canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        
        // Dimensions de l'image selon la rotation
        const isRotated = rotation === 90 || rotation === 270;
        const imgW = isRotated ? image.height : image.width;
        const imgH = isRotated ? image.width : image.height;

        // Calculer le zoom pour contenir l'image avec marge
        const margin = 60;
        const scaleX = (canvasW - margin * 2) / imgW;
        const scaleY = (canvasH - margin * 2) / imgH;
        zoom = Math.min(scaleX, scaleY, 1);

        // Centrer
        panX = 0;
        panY = 0;

        updateZoomIndicator();
    }

    // === RENDU ===

    /**
     * Dessine l'image avec les transformations
     */
    function render() {
        if (!ctx || !canvas || !image) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;

        // Effacer
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Fond damier (transparence)
        drawCheckerboard(canvasW, canvasH);

        // Sauvegarder le contexte
        ctx.save();

        // Centrer sur le canvas
        ctx.translate(canvasW / 2 + panX, canvasH / 2 + panY);

        // Appliquer les transformations
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

        // Appliquer les filtres CSS
        ctx.filter = getFilterString();

        // Dessiner l'image centrée
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        // Restaurer
        ctx.restore();

        // Dessiner la zone de recadrage si active
        if (cropMode && cropRect) {
            drawCropOverlay(canvasW, canvasH);
        }
    }

    /**
     * Construit la chaîne de filtres CSS
     */
    function getFilterString() {
        const filters = [];
        
        if (brightness !== 0) {
            filters.push(`brightness(${1 + brightness / 100})`);
        }
        if (contrast !== 0) {
            filters.push(`contrast(${1 + contrast / 100})`);
        }
        if (saturation !== 0) {
            filters.push(`saturate(${1 + saturation / 100})`);
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    }

    /**
     * Dessine un damier pour montrer la transparence
     */
    function drawCheckerboard(width, height) {
        const size = 10;
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#3a3a3a';
        for (let y = 0; y < height; y += size * 2) {
            for (let x = 0; x < width; x += size * 2) {
                ctx.fillRect(x, y, size, size);
                ctx.fillRect(x + size, y + size, size, size);
            }
        }
    }

    /**
     * Dessine l'overlay de recadrage
     */
    function drawCropOverlay(canvasW, canvasH) {
        const r = cropRect;
        
        // Assombrir les zones hors cadre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        // Haut
        ctx.fillRect(0, 0, canvasW, r.y);
        // Bas
        ctx.fillRect(0, r.y + r.height, canvasW, canvasH - r.y - r.height);
        // Gauche
        ctx.fillRect(0, r.y, r.x, r.height);
        // Droite
        ctx.fillRect(r.x + r.width, r.y, canvasW - r.x - r.width, r.height);

        // Bordure du cadre
        ctx.strokeStyle = 'rgba(var(--accent-color), 1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.width, r.height);

        // Grille des tiers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        // Lignes verticales
        ctx.beginPath();
        ctx.moveTo(r.x + r.width / 3, r.y);
        ctx.lineTo(r.x + r.width / 3, r.y + r.height);
        ctx.moveTo(r.x + r.width * 2 / 3, r.y);
        ctx.lineTo(r.x + r.width * 2 / 3, r.y + r.height);
        // Lignes horizontales
        ctx.moveTo(r.x, r.y + r.height / 3);
        ctx.lineTo(r.x + r.width, r.y + r.height / 3);
        ctx.moveTo(r.x, r.y + r.height * 2 / 3);
        ctx.lineTo(r.x + r.width, r.y + r.height * 2 / 3);
        ctx.stroke();

        // Poignées de redimensionnement
        drawCropHandles(r);
    }

    /**
     * Dessine les poignées de recadrage
     */
    function drawCropHandles(r) {
        const size = CONFIG.cropHandleSize;
        const half = size / 2;
        
        ctx.fillStyle = 'rgb(var(--accent-color))';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const handles = [
            { x: r.x - half, y: r.y - half },                           // nw
            { x: r.x + r.width / 2 - half, y: r.y - half },             // n
            { x: r.x + r.width - half, y: r.y - half },                 // ne
            { x: r.x + r.width - half, y: r.y + r.height / 2 - half },  // e
            { x: r.x + r.width - half, y: r.y + r.height - half },      // se
            { x: r.x + r.width / 2 - half, y: r.y + r.height - half },  // s
            { x: r.x - half, y: r.y + r.height - half },                // sw
            { x: r.x - half, y: r.y + r.height / 2 - half },            // w
        ];
        
        handles.forEach(h => {
            ctx.fillRect(h.x, h.y, size, size);
            ctx.strokeRect(h.x, h.y, size, size);
        });
    }

    /**
     * Met à jour l'aperçu
     */
    function updatePreview() {
        if (!previewCtx || !canvas) return;

        const dpr = window.devicePixelRatio || 1;
        
        // Effacer l'aperçu
        previewCtx.clearRect(0, 0, CONFIG.previewSize, CONFIG.previewSize);

        if (cropMode && cropRect) {
            // Afficher la zone de recadrage
            previewCtx.drawImage(
                canvas,
                cropRect.x * dpr, cropRect.y * dpr, 
                cropRect.width * dpr, cropRect.height * dpr,
                0, 0, CONFIG.previewSize, CONFIG.previewSize
            );
        } else {
            // Afficher l'image entière
            const canvasW = canvas.width / dpr;
            const canvasH = canvas.height / dpr;
            const scale = Math.min(CONFIG.previewSize / canvasW, CONFIG.previewSize / canvasH);
            const w = canvasW * scale;
            const h = canvasH * scale;
            const x = (CONFIG.previewSize - w) / 2;
            const y = (CONFIG.previewSize - h) / 2;
            
            previewCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, x, y, w, h);
        }
    }

    // === TRANSFORMATIONS ===

    function rotateLeft() {
        rotation = (rotation - 90 + 360) % 360;
        fitImageToCanvas();
        initializeCropRect();
        render();
        updatePreview();
    }

    function rotateRight() {
        rotation = (rotation + 90) % 360;
        fitImageToCanvas();
        initializeCropRect();
        render();
        updatePreview();
    }

    function toggleFlipH() {
        flipH = !flipH;
        render();
        updatePreview();
        updateButtonState('flip-h', flipH);
    }

    function toggleFlipV() {
        flipV = !flipV;
        render();
        updatePreview();
        updateButtonState('flip-v', flipV);
    }

    function zoomIn() {
        zoom = Math.min(zoom + CONFIG.zoomStep, CONFIG.maxZoom);
        updateZoomIndicator();
        render();
        updatePreview();
    }

    function zoomOut() {
        zoom = Math.max(zoom - CONFIG.zoomStep, CONFIG.minZoom);
        updateZoomIndicator();
        render();
        updatePreview();
    }

    function setZoom(newZoom, centerX, centerY) {
        const oldZoom = zoom;
        zoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, newZoom));
        
        // Ajuster le pan pour zoomer vers le point spécifié
        if (centerX !== undefined && centerY !== undefined && !cropMode) {
            const dpr = window.devicePixelRatio || 1;
            const canvasW = canvas.width / dpr;
            const canvasH = canvas.height / dpr;
            
            const dx = centerX - canvasW / 2;
            const dy = centerY - canvasH / 2;
            
            const zoomRatio = zoom / oldZoom;
            panX = panX * zoomRatio - dx * (zoomRatio - 1);
            panY = panY * zoomRatio - dy * (zoomRatio - 1);
        }
        
        updateZoomIndicator();
        render();
        updatePreview();
    }

    function toggleCropMode() {
        cropMode = !cropMode;
        
        const indicator = document.getElementById('imageModeIndicator');
        const btn = document.querySelector('.image-editor-btn[data-action="crop"]');
        
        if (cropMode) {
            if (indicator) indicator.classList.add('active');
            if (btn) btn.classList.add('active');
            initializeCropRect();
        } else {
            if (indicator) indicator.classList.remove('active');
            if (btn) btn.classList.remove('active');
        }
        
        render();
        updatePreview();
    }

    function resetTransforms() {
        resetState();
        fitImageToCanvas();
        initializeCropRect();
        
        // Reset sliders
        ['brightness', 'contrast', 'saturation'].forEach(name => {
            const slider = document.getElementById(`${name}Slider`);
            const value = document.getElementById(`${name}Value`);
            if (slider) slider.value = 0;
            if (value) value.textContent = '0';
        });
        
        render();
        updatePreview();
        updateButtonState('flip-h', false);
        updateButtonState('flip-v', false);
        updateButtonState('crop', false);
        
        const indicator = document.getElementById('imageModeIndicator');
        if (indicator) indicator.classList.remove('active');
    }

    function updateZoomIndicator() {
        const indicator = document.getElementById('imageZoomIndicator');
        if (indicator) {
            indicator.textContent = Math.round(zoom * 100) + '%';
        }
    }

    function updateButtonState(action, active) {
        const btn = document.querySelector(`.image-editor-btn[data-action="${action}"]`);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }

    // === ÉVÉNEMENTS FILTRES ===

    function attachFilterEvents() {
        const filters = ['brightness', 'contrast', 'saturation'];
        
        filters.forEach(name => {
            const slider = document.getElementById(`${name}Slider`);
            const valueEl = document.getElementById(`${name}Value`);
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10);
                    if (valueEl) valueEl.textContent = val;
                    
                    switch (name) {
                        case 'brightness': brightness = val; break;
                        case 'contrast': contrast = val; break;
                        case 'saturation': saturation = val; break;
                    }
                    
                    render();
                    updatePreview();
                });
            }
        });
    }

    // === ÉVÉNEMENTS BOUTONS ===

    function attachButtonEvents() {
        const overlay = document.querySelector(`[data-modal-id="${currentModalId}"]`);
        if (!overlay) return;

        // Boutons de la toolbar
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('.image-editor-btn');
            if (!btn) return;

            const action = btn.dataset.action;
            switch (action) {
                case 'rotate-left': rotateLeft(); break;
                case 'rotate-right': rotateRight(); break;
                case 'flip-h': toggleFlipH(); break;
                case 'flip-v': toggleFlipV(); break;
                case 'zoom-in': zoomIn(); break;
                case 'zoom-out': zoomOut(); break;
                case 'crop': toggleCropMode(); break;
                case 'reset': resetTransforms(); break;
            }
        });

        // Bouton sauvegarder
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="save"]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                saveAndClose();
            }
        });

        // Bouton annuler
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="cancel"]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const onCancelCallback = currentState?.onCancel;
                ModalManager.close(currentModalId);
                if (onCancelCallback) {
                    onCancelCallback();
                }
            }
        });
    }

    // === ÉVÉNEMENTS CANVAS ===

    function attachCanvasEvents() {
        const container = document.getElementById('imageEditorCanvasContainer');
        if (!container) return;

        // === SOURIS ===
        
        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (cropMode && cropRect) {
                const handle = getCropHandle(x, y);
                if (handle) {
                    cropResizing = true;
                    cropHandle = handle;
                    cropStartX = x;
                    cropStartY = y;
                    cropStartRect = { ...cropRect };
                    return;
                }
                
                if (isInsideCrop(x, y)) {
                    cropDragging = true;
                    cropStartX = x;
                    cropStartY = y;
                    cropStartRect = { ...cropRect };
                    return;
                }
            }
            
            // Déplacement de l'image
            isDragging = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (cropResizing && cropRect) {
                handleCropResize(e.clientX - canvas.getBoundingClientRect().left, 
                                 e.clientY - canvas.getBoundingClientRect().top);
                render();
                updatePreview();
                return;
            }
            
            if (cropDragging && cropRect) {
                handleCropMove(e.clientX - canvas.getBoundingClientRect().left,
                               e.clientY - canvas.getBoundingClientRect().top);
                render();
                updatePreview();
                return;
            }
            
            if (isDragging) {
                const dx = e.clientX - lastPointerX;
                const dy = e.clientY - lastPointerY;
                
                panX += dx;
                panY += dy;
                
                lastPointerX = e.clientX;
                lastPointerY = e.clientY;
                
                render();
                updatePreview();
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            cropDragging = false;
            cropResizing = false;
            cropHandle = null;
            container.style.cursor = cropMode ? 'crosshair' : 'grab';
        });

        // Curseur selon le contexte
        container.addEventListener('mousemove', (e) => {
            if (isDragging || cropDragging || cropResizing) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (cropMode && cropRect) {
                const handle = getCropHandle(x, y);
                if (handle) {
                    container.style.cursor = getCursorForHandle(handle);
                    return;
                }
                if (isInsideCrop(x, y)) {
                    container.style.cursor = 'move';
                    return;
                }
            }
            
            container.style.cursor = cropMode ? 'crosshair' : 'grab';
        });

        // Zoom molette
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (cropMode) return; // Pas de zoom en mode recadrage
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const delta = -e.deltaY * CONFIG.zoomWheelFactor;
            const newZoom = zoom * (1 + delta);
            
            setZoom(newZoom, x, y);
        }, { passive: false });

        // === TACTILE ===
        
        let touches = [];

        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touches = Array.from(e.touches);

            if (touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                const x = touches[0].clientX - rect.left;
                const y = touches[0].clientY - rect.top;
                
                if (cropMode && cropRect) {
                    const handle = getCropHandle(x, y);
                    if (handle) {
                        cropResizing = true;
                        cropHandle = handle;
                        cropStartX = x;
                        cropStartY = y;
                        cropStartRect = { ...cropRect };
                        return;
                    }
                    
                    if (isInsideCrop(x, y)) {
                        cropDragging = true;
                        cropStartX = x;
                        cropStartY = y;
                        cropStartRect = { ...cropRect };
                        return;
                    }
                }
                
                isDragging = true;
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
            } else if (touches.length === 2 && !cropMode) {
                isDragging = false;
                pinchStartDistance = getDistance(touches[0], touches[1]);
                pinchStartZoom = zoom;
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            touches = Array.from(e.touches);

            if (cropResizing && touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                handleCropResize(touches[0].clientX - rect.left, touches[0].clientY - rect.top);
                render();
                updatePreview();
                return;
            }
            
            if (cropDragging && touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                handleCropMove(touches[0].clientX - rect.left, touches[0].clientY - rect.top);
                render();
                updatePreview();
                return;
            }

            if (touches.length === 1 && isDragging) {
                const dx = touches[0].clientX - lastPointerX;
                const dy = touches[0].clientY - lastPointerY;
                
                panX += dx;
                panY += dy;
                
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
                
                render();
                updatePreview();
            } else if (touches.length === 2 && !cropMode) {
                const currentDistance = getDistance(touches[0], touches[1]);
                const scale = currentDistance / pinchStartDistance;
                const newZoom = pinchStartZoom * scale;
                
                const centerX = (touches[0].clientX + touches[1].clientX) / 2;
                const centerY = (touches[0].clientY + touches[1].clientY) / 2;
                const rect = canvas.getBoundingClientRect();
                
                setZoom(newZoom, centerX - rect.left, centerY - rect.top);
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDragging = false;
            cropDragging = false;
            cropResizing = false;
            cropHandle = null;
            touches = Array.from(e.touches);
            
            if (touches.length === 1) {
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
                isDragging = true;
            }
        }, { passive: false });

        container.style.cursor = 'grab';
    }

    // === GESTION DU RECADRAGE ===

    function getCropHandle(x, y) {
        if (!cropRect) return null;
        
        const r = cropRect;
        const size = CONFIG.cropHandleSize;
        const half = size / 2;
        
        const handles = {
            'nw': { x: r.x - half, y: r.y - half },
            'n':  { x: r.x + r.width / 2 - half, y: r.y - half },
            'ne': { x: r.x + r.width - half, y: r.y - half },
            'e':  { x: r.x + r.width - half, y: r.y + r.height / 2 - half },
            'se': { x: r.x + r.width - half, y: r.y + r.height - half },
            's':  { x: r.x + r.width / 2 - half, y: r.y + r.height - half },
            'sw': { x: r.x - half, y: r.y + r.height - half },
            'w':  { x: r.x - half, y: r.y + r.height / 2 - half },
        };
        
        for (const [name, pos] of Object.entries(handles)) {
            if (x >= pos.x && x <= pos.x + size && y >= pos.y && y <= pos.y + size) {
                return name;
            }
        }
        
        return null;
    }

    function getCursorForHandle(handle) {
        const cursors = {
            'nw': 'nw-resize', 'ne': 'ne-resize',
            'sw': 'sw-resize', 'se': 'se-resize',
            'n': 'n-resize', 's': 's-resize',
            'e': 'e-resize', 'w': 'w-resize'
        };
        return cursors[handle] || 'move';
    }

    function isInsideCrop(x, y) {
        if (!cropRect) return false;
        const r = cropRect;
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
    }

    function handleCropMove(x, y) {
        if (!cropStartRect) return;
        
        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        
        const dx = x - cropStartX;
        const dy = y - cropStartY;
        
        let newX = cropStartRect.x + dx;
        let newY = cropStartRect.y + dy;
        
        // Contraindre aux limites du canvas
        newX = Math.max(0, Math.min(canvasW - cropRect.width, newX));
        newY = Math.max(0, Math.min(canvasH - cropRect.height, newY));
        
        cropRect.x = newX;
        cropRect.y = newY;
    }

    function handleCropResize(x, y) {
        if (!cropStartRect || !cropHandle) return;
        
        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;
        const minSize = CONFIG.minCropSize;
        
        let { x: rx, y: ry, width: rw, height: rh } = cropStartRect;
        const dx = x - cropStartX;
        const dy = y - cropStartY;
        
        switch (cropHandle) {
            case 'nw':
                rx += dx; ry += dy; rw -= dx; rh -= dy;
                break;
            case 'ne':
                ry += dy; rw += dx; rh -= dy;
                break;
            case 'sw':
                rx += dx; rw -= dx; rh += dy;
                break;
            case 'se':
                rw += dx; rh += dy;
                break;
            case 'n':
                ry += dy; rh -= dy;
                break;
            case 's':
                rh += dy;
                break;
            case 'w':
                rx += dx; rw -= dx;
                break;
            case 'e':
                rw += dx;
                break;
        }
        
        // Contraintes
        if (rw < minSize) { rw = minSize; rx = cropStartRect.x + cropStartRect.width - minSize; }
        if (rh < minSize) { rh = minSize; ry = cropStartRect.y + cropStartRect.height - minSize; }
        if (rx < 0) { rw += rx; rx = 0; }
        if (ry < 0) { rh += ry; ry = 0; }
        if (rx + rw > canvasW) { rw = canvasW - rx; }
        if (ry + rh > canvasH) { rh = canvasH - ry; }
        
        cropRect = { x: rx, y: ry, width: Math.max(minSize, rw), height: Math.max(minSize, rh) };
    }

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // === SAUVEGARDE ===

    // Flag pour éviter les sauvegardes multiples
    let isSaving = false;

    /**
     * Sauvegarde l'image et ferme le modal
     */
    async function saveAndClose() {
        if (!canvas || !image || !currentState) return;
        
        // Éviter les clics multiples
        if (isSaving) return;
        isSaving = true;

        // Afficher le loading
        const loadingId = ModalManager.loading(translations.processing || 'Traitement en cours...');

        try {
            const result = await generateAndUploadImage();
            
            ModalManager.close(loadingId);
            
            const onSaveCallback = currentState.onSave;
            ModalManager.close(currentModalId);
            isSaving = false;
            
            if (onSaveCallback) {
                onSaveCallback(result);
            }
        } catch (error) {
            ModalManager.close(loadingId);
            isSaving = false;
            console.error('ImageEditor: Erreur de sauvegarde', error);
            if (typeof showToast === 'function') {
                showToast(translations.error_save || 'Erreur lors de la sauvegarde', 'error');
            }
            // Fermer le modal même en cas d'erreur pour éviter les blocages
            // L'utilisateur devra réessayer via le bouton d'ajout
            ModalManager.close(currentModalId);
        }
    }

    /**
     * Génère l'image finale et l'upload vers le serveur
     */
    async function generateAndUploadImage() {
        // Créer un canvas temporaire avec l'image finale
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d');
        
        // Calculer les dimensions de sortie
        let outputWidth, outputHeight;
        
        if (cropMode && cropRect) {
            // Utiliser les dimensions du recadrage
            const dpr = window.devicePixelRatio || 1;
            outputWidth = cropRect.width * dpr;
            outputHeight = cropRect.height * dpr;
        } else {
            // Utiliser les dimensions de l'image transformée
            const isRotated = rotation === 90 || rotation === 270;
            outputWidth = isRotated ? image.height : image.width;
            outputHeight = isRotated ? image.width : image.height;
        }
        
        // Limiter la taille de sortie
        const maxSize = CONFIG.maxOutputSize;
        if (outputWidth > maxSize || outputHeight > maxSize) {
            const scale = Math.min(maxSize / outputWidth, maxSize / outputHeight);
            outputWidth *= scale;
            outputHeight *= scale;
        }
        
        outputCanvas.width = outputWidth;
        outputCanvas.height = outputHeight;
        
        if (cropMode && cropRect) {
            // Copier la zone de recadrage
            const dpr = window.devicePixelRatio || 1;
            outputCtx.drawImage(
                canvas,
                cropRect.x * dpr, cropRect.y * dpr,
                cropRect.width * dpr, cropRect.height * dpr,
                0, 0, outputWidth, outputHeight
            );
        } else {
            // Dessiner l'image avec les transformations
            outputCtx.save();
            outputCtx.translate(outputWidth / 2, outputHeight / 2);
            outputCtx.rotate((rotation * Math.PI) / 180);
            outputCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            outputCtx.filter = getFilterString();
            
            const isRotated = rotation === 90 || rotation === 270;
            const drawW = isRotated ? outputHeight : outputWidth;
            const drawH = isRotated ? outputWidth : outputHeight;
            
            outputCtx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
            outputCtx.restore();
        }
        
        // Déterminer le format de sortie
        let outputFormat = currentState.outputFormat;
        if (!outputFormat) {
            // Utiliser le format original, ou PNG par défaut
            outputFormat = currentState.originalFormat || 'image/png';
            // Si c'est un SVG, convertir en PNG
            if (outputFormat === 'image/svg+xml') {
                outputFormat = 'image/png';
            }
        }
        
        // Convertir en Blob
        const quality = (outputFormat === 'image/jpeg' || outputFormat === 'image/webp') 
            ? CONFIG.outputQualityJpeg 
            : undefined;
        
        const blob = await new Promise((resolve, reject) => {
            outputCanvas.toBlob(
                (b) => b ? resolve(b) : reject(new Error('Échec création blob')),
                outputFormat,
                quality
            );
        });
        
        // Upload vers le serveur
        const formData = new FormData();
        
        // Générer un nom de fichier
        const ext = outputFormat.split('/')[1].replace('jpeg', 'jpg');
        const filename = `edited_${Date.now()}.${ext}`;
        
        formData.append('image', blob, filename);
        formData.append('format', outputFormat);
        
        const response = await fetch('/api/image-temp.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erreur upload');
        }
        
        const data = await response.json();
        
        return {
            blob: blob,
            tempPath: data.path,
            filename: data.filename,
            width: outputWidth,
            height: outputHeight,
            format: outputFormat
        };
    }

    // === NETTOYAGE ===

    function cleanup() {
        if (image && image.src.startsWith('blob:')) {
            URL.revokeObjectURL(image.src);
        }
        
        canvas = null;
        ctx = null;
        previewCanvas = null;
        previewCtx = null;
        image = null;
        originalImageData = null;
        currentState = null;
        currentModalId = null;
    }

    // === API PUBLIQUE ===

    return {
        open,
        close: () => {
            if (currentModalId) {
                ModalManager.close(currentModalId);
            }
        },
        config: CONFIG,
    };
})();

// Export pour utilisation globale
window.ImageEditor = ImageEditor;
