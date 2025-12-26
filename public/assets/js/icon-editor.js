/**
 * IconEditor - Éditeur d'icônes avec recadrage et transformations
 * 
 * Permet de modifier une image (rotation, zoom, miroir, recadrage)
 * avant de l'enregistrer comme icône.
 * 
 * Utilise ModalManager pour l'affichage.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const IconEditor = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        minZoom: 0.1,
        maxZoom: 5,
        zoomStep: 0.1,
        zoomWheelFactor: 0.001,
        previewSize: 64,            // Taille de l'aperçu de l'icône
        outputSize: 256,            // Taille de sortie de l'icône PNG
        outputFormat: 'image/png',
        outputQuality: 1.0,
    };

    // === ÉTAT ===
    let currentState = null;
    let currentModalId = null;
    let canvas = null;
    let ctx = null;
    let previewCanvas = null;
    let previewCtx = null;
    let image = null;
    
    // Transformations
    let zoom = 1;
    let rotation = 0;           // En degrés (0, 90, 180, 270)
    let flipH = false;
    let flipV = false;
    let panX = 0;
    let panY = 0;
    
    // Interaction
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;

    // === TRADUCTIONS PAR DÉFAUT ===
    const defaultTranslations = {
        title: 'Éditeur d\'icône',
        rotate_left: 'Rotation gauche',
        rotate_right: 'Rotation droite',
        flip_horizontal: 'Miroir horizontal',
        flip_vertical: 'Miroir vertical',
        zoom_in: 'Zoom +',
        zoom_out: 'Zoom -',
        reset: 'Réinitialiser',
        cancel: 'Annuler',
        save: 'Enregistrer',
        preview: 'Aperçu',
        drag_hint: 'Glissez pour déplacer',
        zoom_hint: 'Molette ou pincement pour zoomer',
        loading: 'Chargement...',
        error_load: 'Erreur de chargement de l\'image',
        error_save: 'Erreur lors de la sauvegarde',
    };

    let translations = { ...defaultTranslations };

    // === ICÔNES SVG ===
    const ICONS = {
        rotateLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>',
        rotateRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>',
        flipH: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M16 7l4 5-4 5M8 7l-4 5 4 5"/></svg>',
        flipV: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M7 8l5-4 5 4M7 16l5 4 5-4"/></svg>',
        zoomIn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        zoomOut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    };

    // === TEMPLATE DU MODAL ===
    function getModalContent() {
        return `
            <div class="icon-editor">
                <!-- Zone de canvas principale -->
                <div class="icon-editor-canvas-container" id="iconEditorCanvasContainer">
                    <canvas id="iconEditorCanvas"></canvas>
                    
                    <!-- Overlay de prévisualisation -->
                    <div class="icon-editor-preview-overlay" id="iconEditorPreviewOverlay">
                        <div class="preview-frame">
                            <canvas id="iconEditorPreview" width="${CONFIG.previewSize}" height="${CONFIG.previewSize}"></canvas>
                        </div>
                        <span class="preview-label">${translations.preview}</span>
                    </div>
                    
                    <!-- Indicateur de hint -->
                    <div class="icon-editor-hints">
                        <span class="hint-drag">${translations.drag_hint}</span>
                        <span class="hint-zoom">${translations.zoom_hint}</span>
                    </div>
                </div>
                
                <!-- Barre d'outils -->
                <div class="icon-editor-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="icon-editor-btn" data-action="rotate-left" title="${translations.rotate_left}">
                            ${ICONS.rotateLeft}
                        </button>
                        <button type="button" class="icon-editor-btn" data-action="rotate-right" title="${translations.rotate_right}">
                            ${ICONS.rotateRight}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="icon-editor-btn" data-action="flip-h" title="${translations.flip_horizontal}">
                            ${ICONS.flipH}
                        </button>
                        <button type="button" class="icon-editor-btn" data-action="flip-v" title="${translations.flip_vertical}">
                            ${ICONS.flipV}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="icon-editor-btn" data-action="zoom-out" title="${translations.zoom_out}">
                            ${ICONS.zoomOut}
                        </button>
                        <span class="zoom-indicator" id="zoomIndicator">100%</span>
                        <button type="button" class="icon-editor-btn" data-action="zoom-in" title="${translations.zoom_in}">
                            ${ICONS.zoomIn}
                        </button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button type="button" class="icon-editor-btn" data-action="reset" title="${translations.reset}">
                            ${ICONS.reset}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // === INITIALISATION ===

    /**
     * Ouvre l'éditeur d'icône
     * @param {Object} options - Options de configuration
     * @param {string|File|Blob} options.image - Image source (URL, File ou Blob)
     * @param {string} options.caller - Identifiant du modal appelant
     * @param {Function} options.onSave - Callback appelé avec le Blob PNG résultant
     * @param {Function} options.onCancel - Callback appelé si annulé
     * @param {Object} options.translations - Traductions personnalisées
     */
    function open(options = {}) {
        // Fusionner les traductions
        if (options.translations) {
            translations = { ...defaultTranslations, ...options.translations };
        }

        // Réinitialiser l'état
        resetState();
        
        currentState = {
            caller: options.caller || null,
            onSave: options.onSave || null,
            onCancel: options.onCancel || null,
            imageSource: options.image || null,
        };

        // Ouvrir le modal
        currentModalId = ModalManager.open({
            title: translations.title,
            content: getModalContent(),
            size: 'modal-lg',
            customClass: 'modal-icon-editor',
            closeOnOverlay: false,
            closeOnEscape: false,
            showFooter: true,
            buttons: [
                { text: translations.cancel, action: 'cancel', class: 'btn-secondary' },
                { text: translations.save, action: 'save', class: 'btn-primary' }
            ],
            onOpen: (id) => {
                initializeEditor();
                loadImage(currentState.imageSource);
            },
            onClose: (reason) => {
                // Sauvegarder la référence avant cleanup
                const onCancelCallback = currentState?.onCancel;
                cleanup();
                // Note: le callback onCancel est maintenant géré dans attachButtonEvents
                // Cette vérification est gardée pour le cas où le modal serait fermé autrement
                if (reason === 'cancel' && onCancelCallback) {
                    // Ne pas appeler ici car déjà géré dans attachButtonEvents
                    // onCancelCallback();
                }
            },
            onConfirm: () => {
                // Ne pas utiliser, on gère avec le bouton save
            }
        });

        // Attacher les événements des boutons après ouverture
        setTimeout(() => {
            attachButtonEvents();
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
        isDragging = false;
    }

    /**
     * Initialise le canvas et les événements
     */
    function initializeEditor() {
        canvas = document.getElementById('iconEditorCanvas');
        ctx = canvas ? canvas.getContext('2d') : null;
        previewCanvas = document.getElementById('iconEditorPreview');
        previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

        if (!canvas || !ctx) {
            console.error('IconEditor: Canvas non trouvé');
            return;
        }

        // Dimensionner le canvas à la taille du conteneur
        const container = document.getElementById('iconEditorCanvasContainer');
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
        ctx.scale(dpr, dpr);
    }

    /**
     * Charge l'image source
     */
    function loadImage(source) {
        if (!source) {
            console.error('IconEditor: Aucune image source');
            return;
        }

        image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            // Centrer l'image et ajuster le zoom initial
            fitImageToCanvas();
            render();
            updatePreview();
        };

        image.onerror = () => {
            console.error('IconEditor: Erreur de chargement de l\'image');
            if (typeof showToast === 'function') {
                showToast(translations.error_load, 'error');
            }
        };

        // Charger selon le type de source
        if (source instanceof File || source instanceof Blob) {
            image.src = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
            image.src = source;
        }
    }

    /**
     * Ajuste le zoom pour que l'image soit entièrement visible
     */
    function fitImageToCanvas() {
        if (!image || !canvas) return;

        const canvasW = canvas.width / (window.devicePixelRatio || 1);
        const canvasH = canvas.height / (window.devicePixelRatio || 1);
        
        // Dimensions de l'image selon la rotation
        const isRotated = rotation === 90 || rotation === 270;
        const imgW = isRotated ? image.height : image.width;
        const imgH = isRotated ? image.width : image.height;

        // Calculer le zoom pour contenir l'image avec marge
        const margin = 40;
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

        // Dessiner l'image centrée
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        // Restaurer
        ctx.restore();

        // Dessiner le cadre de prévisualisation
        drawPreviewFrame(canvasW, canvasH);
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
     * Dessine le cadre de prévisualisation (zone de capture)
     */
    function drawPreviewFrame(canvasW, canvasH) {
        const frameSize = Math.min(canvasW, canvasH) * 0.6;
        const x = (canvasW - frameSize) / 2;
        const y = (canvasH - frameSize) / 2;

        // Assombrir les zones hors cadre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // Haut
        ctx.fillRect(0, 0, canvasW, y);
        // Bas
        ctx.fillRect(0, y + frameSize, canvasW, canvasH - y - frameSize);
        // Gauche
        ctx.fillRect(0, y, x, frameSize);
        // Droite
        ctx.fillRect(x + frameSize, y, canvasW - x - frameSize, frameSize);

        // Bordure du cadre
        ctx.strokeStyle = 'rgba(var(--accent-color), 1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, frameSize, frameSize);

        // Coins
        const cornerSize = 15;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        
        // Coin haut-gauche
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        // Coin haut-droit
        ctx.beginPath();
        ctx.moveTo(x + frameSize - cornerSize, y);
        ctx.lineTo(x + frameSize, y);
        ctx.lineTo(x + frameSize, y + cornerSize);
        ctx.stroke();

        // Coin bas-gauche
        ctx.beginPath();
        ctx.moveTo(x, y + frameSize - cornerSize);
        ctx.lineTo(x, y + frameSize);
        ctx.lineTo(x + cornerSize, y + frameSize);
        ctx.stroke();

        // Coin bas-droit
        ctx.beginPath();
        ctx.moveTo(x + frameSize - cornerSize, y + frameSize);
        ctx.lineTo(x + frameSize, y + frameSize);
        ctx.lineTo(x + frameSize, y + frameSize - cornerSize);
        ctx.stroke();
    }

    /**
     * Met à jour l'aperçu de l'icône
     */
    function updatePreview() {
        if (!previewCtx || !canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasW = canvas.width / dpr;
        const canvasH = canvas.height / dpr;

        // Zone de capture
        const frameSize = Math.min(canvasW, canvasH) * 0.6;
        const x = (canvasW - frameSize) / 2;
        const y = (canvasH - frameSize) / 2;

        // Effacer l'aperçu
        previewCtx.clearRect(0, 0, CONFIG.previewSize, CONFIG.previewSize);

        // Copier la zone de capture vers l'aperçu
        // On utilise le canvas principal comme source
        previewCtx.drawImage(
            canvas,
            x * dpr, y * dpr, frameSize * dpr, frameSize * dpr,
            0, 0, CONFIG.previewSize, CONFIG.previewSize
        );
    }

    // === TRANSFORMATIONS ===

    function rotateLeft() {
        rotation = (rotation - 90 + 360) % 360;
        render();
        updatePreview();
    }

    function rotateRight() {
        rotation = (rotation + 90) % 360;
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
        if (centerX !== undefined && centerY !== undefined) {
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

    function resetTransforms() {
        resetState();
        fitImageToCanvas();
        render();
        updatePreview();
        updateButtonState('flip-h', false);
        updateButtonState('flip-v', false);
    }

    function updateZoomIndicator() {
        const indicator = document.getElementById('zoomIndicator');
        if (indicator) {
            indicator.textContent = Math.round(zoom * 100) + '%';
        }
    }

    function updateButtonState(action, active) {
        const btn = document.querySelector(`.icon-editor-btn[data-action="${action}"]`);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }

    // === ÉVÉNEMENTS ===

    function attachButtonEvents() {
        const overlay = document.querySelector(`[data-modal-id="${currentModalId}"]`);
        if (!overlay) return;

        // Boutons de la toolbar
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-editor-btn');
            if (!btn) return;

            const action = btn.dataset.action;
            switch (action) {
                case 'rotate-left': rotateLeft(); break;
                case 'rotate-right': rotateRight(); break;
                case 'flip-h': toggleFlipH(); break;
                case 'flip-v': toggleFlipV(); break;
                case 'zoom-in': zoomIn(); break;
                case 'zoom-out': zoomOut(); break;
                case 'reset': resetTransforms(); break;
            }
        });

        // Boutons du footer (annuler/sauvegarder)
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="save"]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                saveAndClose();
            }
        });

        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="cancel"]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                // Sauvegarder la référence avant cleanup (qui sera appelé par onClose)
                const onCancelCallback = currentState?.onCancel;
                ModalManager.close(currentModalId);
                if (onCancelCallback) {
                    onCancelCallback();
                }
            }
        });
    }

    function attachCanvasEvents() {
        const container = document.getElementById('iconEditorCanvasContainer');
        if (!container) return;

        // === SOURIS ===
        
        // Déplacement
        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Clic gauche uniquement
            isDragging = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - lastPointerX;
            const dy = e.clientY - lastPointerY;
            
            panX += dx;
            panY += dy;
            
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            
            render();
            updatePreview();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
            }
        });

        // Zoom molette
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const delta = -e.deltaY * CONFIG.zoomWheelFactor;
            const newZoom = zoom * (1 + delta);
            
            setZoom(newZoom, x, y);
        }, { passive: false });

        // === TACTILE ===

        let touchStartTime = 0;
        let touches = [];

        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touches = Array.from(e.touches);
            touchStartTime = Date.now();

            if (touches.length === 1) {
                // Un doigt : déplacement
                isDragging = true;
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
            } else if (touches.length === 2) {
                // Deux doigts : pincement
                isDragging = false;
                pinchStartDistance = getDistance(touches[0], touches[1]);
                pinchStartZoom = zoom;
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            touches = Array.from(e.touches);

            if (touches.length === 1 && isDragging) {
                // Déplacement
                const dx = touches[0].clientX - lastPointerX;
                const dy = touches[0].clientY - lastPointerY;
                
                panX += dx;
                panY += dy;
                
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
                
                render();
                updatePreview();
            } else if (touches.length === 2) {
                // Pincement pour zoom
                const currentDistance = getDistance(touches[0], touches[1]);
                const scale = currentDistance / pinchStartDistance;
                const newZoom = pinchStartZoom * scale;
                
                // Centre du pincement
                const centerX = (touches[0].clientX + touches[1].clientX) / 2;
                const centerY = (touches[0].clientY + touches[1].clientY) / 2;
                const rect = canvas.getBoundingClientRect();
                
                setZoom(newZoom, centerX - rect.left, centerY - rect.top);
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDragging = false;
            touches = Array.from(e.touches);
            
            if (touches.length === 1) {
                // Retour à un doigt après pincement
                lastPointerX = touches[0].clientX;
                lastPointerY = touches[0].clientY;
                isDragging = true;
            }
        }, { passive: false });

        // Style curseur initial
        container.style.cursor = 'grab';
    }

    /**
     * Calcule la distance entre deux points tactiles
     */
    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // === SAUVEGARDE ===

    /**
     * Sauvegarde l'icône et ferme le modal
     */
    async function saveAndClose() {
        if (!canvas || !image || !currentState) return;

        try {
            const blob = await generateIcon();
            
            // Sauvegarder la référence avant cleanup
            const onSaveCallback = currentState.onSave;
            
            ModalManager.close(currentModalId);
            
            if (onSaveCallback) {
                onSaveCallback(blob);
            }
        } catch (error) {
            console.error('IconEditor: Erreur de sauvegarde', error);
            if (typeof showToast === 'function') {
                showToast(translations.error_save, 'error');
            }
        }
    }

    /**
     * Génère le Blob PNG de l'icône
     */
    function generateIcon() {
        return new Promise((resolve, reject) => {
            try {
                // Créer un canvas temporaire à la taille de sortie
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = CONFIG.outputSize;
                outputCanvas.height = CONFIG.outputSize;
                const outputCtx = outputCanvas.getContext('2d');

                // Calculer la zone de capture depuis le canvas principal
                const dpr = window.devicePixelRatio || 1;
                const canvasW = canvas.width / dpr;
                const canvasH = canvas.height / dpr;
                const frameSize = Math.min(canvasW, canvasH) * 0.6;
                const x = (canvasW - frameSize) / 2;
                const y = (canvasH - frameSize) / 2;

                // Dessiner la zone de capture dans le canvas de sortie
                outputCtx.drawImage(
                    canvas,
                    x * dpr, y * dpr, frameSize * dpr, frameSize * dpr,
                    0, 0, CONFIG.outputSize, CONFIG.outputSize
                );

                // Convertir en Blob
                outputCanvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Échec de création du Blob'));
                        }
                    },
                    CONFIG.outputFormat,
                    CONFIG.outputQuality
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    // === NETTOYAGE ===

    function cleanup() {
        // Libérer les ressources
        if (image && image.src.startsWith('blob:')) {
            URL.revokeObjectURL(image.src);
        }
        
        canvas = null;
        ctx = null;
        previewCanvas = null;
        previewCtx = null;
        image = null;
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
        // Exposer la configuration pour personnalisation
        config: CONFIG,
    };
})();

// Export pour utilisation globale
window.IconEditor = IconEditor;
