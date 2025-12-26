/**
 * CameraCapture - Modal de capture photo avec caméra
 * 
 * Permet de prendre une photo avec la caméra de l'appareil,
 * avec sélection de caméra, zoom et flash.
 * La photo est ensuite envoyée à ImageEditor pour modification.
 * 
 * Mode 'scan' : Optimisé pour OCR/code-barres avec overlay de guidage.
 * 
 * Utilise ModalManager pour l'affichage.
 * Compatible avec le système i18n et les thèmes SnowShelf.
 * 
 * @author SnowShelf
 * @version 1.1.0
 */

const CameraCapture = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        minZoom: 1,
        maxZoom: 5,
        zoomStep: 0.1,
        defaultFacingMode: 'environment', // 'environment' = arrière, 'user' = avant
        preferredResolution: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        photoQuality: 0.92,
        photoFormat: 'image/jpeg',
        // Config mode scan
        scanOverlayTypes: ['barcode', 'document', 'auto'],
    };

    // === ÉTAT ===
    let currentState = null;
    let currentModalId = null;
    let videoElement = null;
    let canvasElement = null;
    let stream = null;
    let currentZoom = 1;
    let currentFacingMode = CONFIG.defaultFacingMode;
    let availableCameras = [];
    let currentCameraIndex = 0;
    let flashMode = 'off'; // 'off', 'on', 'auto'
    let track = null;
    let capabilities = null;
    let isCapturing = false;
    let currentMode = 'default'; // 'default' | 'scan'
    let scanType = 'auto'; // 'barcode' | 'document' | 'auto'
    let barcodeScannerActive = false; // Scanner live actif

    // === TRADUCTIONS ===
    let translations = {};

    // === ICÔNES SVG ===
    const ICONS = {
        camera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
        switchCamera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"></path><circle cx="12" cy="12" r="3"></circle><path d="m18 22-3-3 3-3"></path><path d="m6 2 3 3-3 3"></path></svg>',
        flashOff: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9.39 9.39L5 14l4-1-1 7 6.36-6.36"></path><path d="M14.61 5h-3.61l-1 3.61"></path></svg>',
        flashOn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        flashAuto: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon><text x="16" y="22" font-size="8" fill="currentColor" stroke="none">A</text></svg>',
        zoomIn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        zoomOut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        capture: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
        close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        barcode: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14"></path><path d="M8 5v14"></path><path d="M12 5v14"></path><path d="M17 5v14"></path><path d="M21 5v14"></path></svg>',
        document: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    };

    // === TEMPLATE DU MODAL ===
    function getModalContent() {
        const t = translations;
        const isScanMode = currentMode === 'scan';
        const scanOverlay = isScanMode ? getScanOverlayHTML() : '';
        const scanHint = isScanMode ? getScanHintText() : '';
        
        return `
            <div class="camera-capture ${isScanMode ? 'camera-capture-scan-mode' : ''}" data-scan-type="${scanType}">
                <!-- Zone vidéo principale -->
                <div class="camera-capture-video-container" id="cameraCaptureContainer">
                    <video id="cameraCaptureVideo" autoplay playsinline muted></video>
                    <canvas id="cameraCaptureCanvas" style="display: none;"></canvas>
                    
                    <!-- Overlay de scan (mode scan uniquement) -->
                    ${scanOverlay}
                    
                    <!-- Overlay de chargement -->
                    <div class="camera-capture-loading" id="cameraLoading">
                        <div class="loading-spinner"></div>
                        <p>${t.initializing || 'Initialisation de la caméra...'}</p>
                    </div>
                    
                    <!-- Overlay d'erreur -->
                    <div class="camera-capture-error" id="cameraError" style="display: none;">
                        <div class="error-icon">${ICONS.camera}</div>
                        <p id="cameraErrorMessage">${t.error_camera || 'Impossible d\'accéder à la caméra'}</p>
                        <button type="button" class="btn btn-secondary" id="cameraRetryBtn">
                            ${t.retry || 'Réessayer'}
                        </button>
                    </div>
                    
                    <!-- Indicateur de zoom -->
                    <div class="camera-capture-zoom-indicator" id="cameraZoomIndicator">
                        <span id="cameraZoomValue">1.0x</span>
                    </div>
                    
                    <!-- Hints -->
                    <div class="camera-capture-hints">
                        <span class="hint-zoom">${isScanMode ? scanHint : (t.zoom_hint || 'Molette ou pincement pour zoomer')}</span>
                    </div>
                </div>
                
                <!-- Barre d'outils -->
                <div class="camera-capture-toolbar">
                    <!-- Contrôles gauche -->
                    <div class="toolbar-left">
                        <button type="button" class="camera-btn" id="cameraFlashBtn" data-action="flash" title="${t.flash || 'Flash'}">
                            ${ICONS.flashOff}
                        </button>
                    </div>
                    
                    <!-- Bouton capture central -->
                    <div class="toolbar-center">
                        <button type="button" class="camera-btn camera-btn-capture ${isScanMode ? 'scan-mode' : ''}" id="cameraCaptureBtn" data-action="capture" title="${isScanMode ? (t.scan_capture || 'Scanner') : (t.take_photo || 'Prendre une photo')}">
                            <span class="capture-outer"></span>
                            <span class="capture-inner"></span>
                        </button>
                    </div>
                    
                    <!-- Contrôles droite -->
                    <div class="toolbar-right">
                        <button type="button" class="camera-btn" id="cameraSwitchBtn" data-action="switch" title="${t.switch_camera || 'Changer de caméra'}">
                            ${ICONS.switchCamera}
                        </button>
                    </div>
                </div>
                
                <!-- Barre de zoom -->
                <div class="camera-capture-zoom-bar">
                    <button type="button" class="camera-zoom-btn" data-action="zoom-out" title="${t.zoom_out || 'Zoom -'}">
                        ${ICONS.zoomOut}
                    </button>
                    <input type="range" id="cameraZoomSlider" min="1" max="5" step="0.1" value="1" class="camera-zoom-slider">
                    <button type="button" class="camera-zoom-btn" data-action="zoom-in" title="${t.zoom_in || 'Zoom +'}">
                        ${ICONS.zoomIn}
                    </button>
                </div>
                
                <!-- Sélecteur de caméra (desktop) -->
                <div class="camera-capture-selector" id="cameraSelectorWrapper" style="display: none;">
                    <label for="cameraSelectorSelect">
                        ${ICONS.camera}
                        <span>${t.select_camera || 'Caméra :'}</span>
                    </label>
                    <select id="cameraSelectorSelect" class="form-control"></select>
                </div>
            </div>
        `;
    }

    /**
     * Génère le HTML de l'overlay de scan
     */
    function getScanOverlayHTML() {
        const t = translations;
        const isBarcode = scanType === 'barcode';
        const isDocument = scanType === 'document';
        
        // Icône selon le type
        let icon = ICONS.barcode;
        if (isDocument) {
            icon = ICONS.document;
        }
        
        return `
            <div class="camera-scan-overlay" data-type="${scanType}">
                <div class="scan-overlay-corners">
                    <div class="scan-corner top-left"></div>
                    <div class="scan-corner top-right"></div>
                    <div class="scan-corner bottom-left"></div>
                    <div class="scan-corner bottom-right"></div>
                </div>
                <div class="scan-overlay-frame ${isBarcode ? 'barcode-frame' : ''}">
                    ${isBarcode ? '<div class="scan-laser"></div>' : ''}
                </div>
                <div class="scan-overlay-label">
                    ${icon}
                    <span>${getScanLabelText()}</span>
                </div>
            </div>
        `;
    }

    /**
     * Retourne le texte du label de scan selon le type
     */
    function getScanLabelText() {
        const t = translations;
        switch (scanType) {
            case 'barcode':
                return t.scan_barcode_label || 'Placez le code-barres dans le cadre';
            case 'document':
                return t.scan_document_label || 'Cadrez le document ou le texte';
            default:
                return t.scan_auto_label || 'Cadrez le code-barres ou le texte';
        }
    }

    /**
     * Retourne le texte du hint de scan
     */
    function getScanHintText() {
        const t = translations;
        switch (scanType) {
            case 'barcode':
                return t.scan_barcode_hint || 'Alignez le code-barres avec le laser';
            case 'document':
                return t.scan_document_hint || 'Assurez-vous que le texte est bien lisible';
            default:
                return t.scan_auto_hint || 'Code-barres ou texte seront détectés automatiquement';
        }
    }

    // === INITIALISATION ===

    /**
     * Ouvre le modal de capture photo
     * @param {Object} options - Options de configuration
     * @param {string} options.caller - Identifiant du modal appelant
     * @param {string} options.targetField - Champ de destination final
     * @param {string} options.facingMode - 'environment' (arrière) ou 'user' (avant)
     * @param {Function} options.onCapture - Callback appelé avec le blob de l'image
     * @param {Function} options.onCancel - Callback appelé si annulé
     * @param {boolean} options.skipEditor - Si true, retourne directement l'image sans passer par l'éditeur
     * @param {Object} options.editorOptions - Options à passer à ImageEditor
     * @param {string} options.mode - 'default' ou 'scan' pour le mode scanner OCR/barcode
     * @param {string} options.scanType - 'barcode', 'document' ou 'auto' (si mode='scan')
     */
    function open(options = {}) {
        // En mode scan, skipEditor est true par défaut
        if (options.mode === 'scan' && options.skipEditor === undefined) {
            options.skipEditor = true;
        }
        
        // Charger les traductions depuis i18n si disponible
        if (typeof window.__ === 'function') {
            translations = {
                title: __('camera.title'),
                initializing: __('camera.initializing'),
                error_camera: __('camera.error_camera'),
                error_permission: __('camera.error_permission'),
                error_not_supported: __('camera.error_not_supported'),
                retry: __('camera.retry'),
                take_photo: __('camera.take_photo'),
                switch_camera: __('camera.switch_camera'),
                flash: __('camera.flash'),
                flash_off: __('camera.flash_off'),
                flash_on: __('camera.flash_on'),
                flash_auto: __('camera.flash_auto'),
                zoom_in: __('common.zoom_in') || __('image_editor.zoom_in'),
                zoom_out: __('common.zoom_out') || __('image_editor.zoom_out'),
                zoom_hint: __('camera.zoom_hint'),
                select_camera: __('camera.select_camera'),
                camera: __('camera.camera'),
                wide_camera: __('camera.wide_camera'),
                ultra_camera: __('camera.ultra_camera'),
                tele_camera: __('camera.tele_camera'),
                cancel: __('common.cancel'),
                processing: __('camera.processing'),
                front_camera: __('camera.front_camera'),
                back_camera: __('camera.back_camera'),
                // Traductions mode scan
                scan_title: __('camera.scan_title'),
                scan_capture: __('camera.scan_capture'),
                scan_barcode_label: __('camera.scan_barcode_label'),
                scan_document_label: __('camera.scan_document_label'),
                scan_auto_label: __('camera.scan_auto_label'),
                scan_barcode_hint: __('camera.scan_barcode_hint'),
                scan_document_hint: __('camera.scan_document_hint'),
                scan_auto_hint: __('camera.scan_auto_hint'),
            };
        }
        
        // Fusionner avec les traductions personnalisées
        if (options.translations) {
            translations = { ...translations, ...options.translations };
        }

        // Vérifier le support de l'API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (typeof showToast === 'function') {
                showToast(translations.error_not_supported || 'Votre navigateur ne supporte pas l\'accès à la caméra', 'error');
            }
            if (typeof options.onCancel === 'function') {
                options.onCancel();
            }
            return null;
        }

        // Réinitialiser l'état
        resetState();
        
        // Définir le mode APRÈS resetState (qui remet à default)
        currentMode = options.mode || 'default';
        scanType = options.scanType || 'auto';
        
        currentState = {
            caller: options.caller || null,
            targetField: options.targetField || null,
            onCapture: options.onCapture || null,
            onCancel: options.onCancel || null,
            skipEditor: options.skipEditor || false,
            editorOptions: options.editorOptions || {},
        };
        
        currentFacingMode = options.facingMode || CONFIG.defaultFacingMode;

        // Déterminer le titre selon le mode
        const modalTitle = currentMode === 'scan' 
            ? (translations.scan_title || 'Scanner') 
            : (translations.title || 'Prendre une photo');

        // Ouvrir le modal
        currentModalId = ModalManager.open({
            title: modalTitle,
            content: getModalContent(),
            size: 'modal-lg',
            customClass: 'modal-camera-capture' + (currentMode === 'scan' ? ' scan-mode' : ''),
            closeOnOverlay: false,
            closeOnEscape: true,
            showFooter: true,
            buttons: [
                { text: translations.cancel || 'Annuler', action: 'cancel', class: 'btn-secondary' }
            ],
            onOpen: (id) => {
                initializeCamera();
            },
            onClose: (reason) => {
                cleanup();
                if (reason !== 'capture' && typeof currentState?.onCancel === 'function') {
                    currentState.onCancel();
                }
            }
        });

        // Attacher les événements après ouverture
        setTimeout(() => {
            attachEvents();
        }, 50);

        return currentModalId;
    }

    /**
     * Réinitialise l'état
     */
    function resetState() {
        stopCamera();
        currentZoom = 1;
        currentCameraIndex = 0;
        flashMode = 'off';
        availableCameras = [];
        isCapturing = false;
        currentMode = 'default';
        scanType = 'auto';
    }
    
    /**
     * Initialise l'overlay de scan
     */
    function initScanOverlay() {
        const overlayContainer = document.querySelector('.camera-scan-overlay');
        if (!overlayContainer) return;
        
        overlayContainer.classList.add('active');
        
        // Ajouter le sélecteur de type de scan
        initScanTypeSelector();
        
        // Démarrer le scanner de code-barres si en mode barcode ou auto
        if ((scanType === 'barcode' || scanType === 'auto') && typeof BarcodeScanner !== 'undefined') {
            startBarcodeScanner();
        }
    }
    
    /**
     * Démarre le scanner de code-barres live
     */
    async function startBarcodeScanner() {
        if (barcodeScannerActive || !videoElement) return;
        
        try {
            await BarcodeScanner.init({
                video: videoElement,
                onDetect: handleBarcodeDetected,
                onError: (error) => console.warn('BarcodeScanner:', error)
            });
            
            BarcodeScanner.start();
            barcodeScannerActive = true;
            
            // Ajouter un indicateur visuel
            updateScanStatus('scanning');
        } catch (error) {
            // Scanner non disponible, mode capture manuelle uniquement
            barcodeScannerActive = false;
        }
    }
    
    /**
     * Arrête le scanner de code-barres
     */
    function stopBarcodeScanner() {
        if (!barcodeScannerActive) return;
        
        if (typeof BarcodeScanner !== 'undefined') {
            BarcodeScanner.stop();
        }
        barcodeScannerActive = false;
        updateScanStatus('idle');
    }
    
    /**
     * Gère la détection d'un code-barres
     */
    function handleBarcodeDetected(result) {
        // Code-barres détecté
        
        // Afficher le feedback visuel
        updateScanStatus('detected', result.code);
        
        // Vibration si disponible
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        // Créer un résultat avec le code détecté
        const scanResult = {
            type: 'barcode',
            code: result.code,
            format: result.format
        };
        
        // Fermer le modal et retourner le résultat
        setTimeout(() => {
            if (typeof currentState?.onCapture === 'function') {
                currentState.onCapture(scanResult);
            }
            close('capture');
        }, 500);
    }
    
    /**
     * Met à jour le statut visuel du scan
     */
    function updateScanStatus(status, data = null) {
        const overlay = document.querySelector('.camera-scan-overlay');
        const label = document.querySelector('.scan-overlay-label span');
        
        if (!overlay) return;
        
        overlay.classList.remove('scanning', 'detected');
        
        switch (status) {
            case 'scanning':
                overlay.classList.add('scanning');
                if (label) label.textContent = translations.scan_searching || 'Recherche...';
                break;
            case 'detected':
                overlay.classList.add('detected');
                if (label) label.textContent = data || translations.scan_detected || 'Détecté !';
                break;
            default:
                if (label) label.textContent = getScanLabelText();
        }
    }
    
    /**
     * Initialise le sélecteur de type de scan
     */
    function initScanTypeSelector() {
        const toolbarLeft = document.querySelector('.toolbar-left');
        if (!toolbarLeft) return;
        
        // Créer le groupe de boutons pour le type de scan
        const scanTypeGroup = document.createElement('div');
        scanTypeGroup.className = 'scan-type-group';
        scanTypeGroup.innerHTML = `
            <button type="button" class="btn-scan-type ${scanType === 'barcode' ? 'active' : ''}" data-type="barcode" title="${translations.scan_barcode_label || 'Code-barres'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="3" height="16"/>
                    <rect x="8" y="4" width="1" height="16"/>
                    <rect x="11" y="4" width="2" height="16"/>
                    <rect x="15" y="4" width="1" height="16"/>
                    <rect x="18" y="4" width="3" height="16"/>
                </svg>
            </button>
            <button type="button" class="btn-scan-type ${scanType === 'document' ? 'active' : ''}" data-type="document" title="${translations.scan_document_label || 'Document'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            </button>
            <button type="button" class="btn-scan-type ${scanType === 'auto' ? 'active' : ''}" data-type="auto" title="${translations.scan_auto_label || 'Auto'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            </button>
        `;
        
        // Insérer au début des contrôles
        toolbarLeft.insertBefore(scanTypeGroup, toolbarLeft.firstChild);
        
        // Ajouter les événements
        scanTypeGroup.querySelectorAll('.btn-scan-type').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newType = e.currentTarget.dataset.type;
                changeScanType(newType);
            });
        });
    }
    
    /**
     * Change le type de scan
     * @param {string} newType - 'barcode', 'document' ou 'auto'
     */
    function changeScanType(newType) {
        if (newType === scanType) return;
        
        const previousType = scanType;
        scanType = newType;
        
        // Mettre à jour les boutons actifs
        document.querySelectorAll('.btn-scan-type').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === newType);
        });
        
        // Mettre à jour l'overlay
        const overlayContainer = document.querySelector('.camera-scan-overlay');
        if (overlayContainer) {
            overlayContainer.outerHTML = getScanOverlayHTML();
            // Réactiver l'overlay
            const newOverlay = document.querySelector('.camera-scan-overlay');
            if (newOverlay) newOverlay.classList.add('active');
        }
        
        // Mettre à jour le hint
        const hintElement = document.querySelector('.camera-capture-hints .hint-zoom');
        if (hintElement) {
            hintElement.textContent = getScanHintText();
        }
        
        // Mettre à jour le label de l'overlay
        const labelElement = document.querySelector('.scan-overlay-label span');
        if (labelElement) {
            labelElement.textContent = getScanLabelText();
        }
        
        // Mettre à jour l'attribut data-scan-type
        const captureContainer = document.querySelector('.camera-capture');
        if (captureContainer) {
            captureContainer.setAttribute('data-scan-type', newType);
        }
        
        // Gérer le scanner de code-barres selon le type
        if (typeof BarcodeScanner !== 'undefined') {
            if (newType === 'barcode' || newType === 'auto') {
                // Démarrer le scanner si pas déjà actif
                if (!barcodeScannerActive) {
                    startBarcodeScanner();
                }
            } else if (newType === 'document') {
                // Arrêter le scanner en mode document
                stopBarcodeScanner();
            }
        }
    }

    /**
     * Initialise la caméra
     */
    async function initializeCamera() {
        videoElement = document.getElementById('cameraCaptureVideo');
        canvasElement = document.getElementById('cameraCaptureCanvas');
        
        if (!videoElement || !canvasElement) {
            console.error('CameraCapture: Éléments DOM non trouvés');
            return;
        }

        showLoading(true);
        showError(false);

        try {
            // Lister les caméras disponibles
            await enumerateCameras();
            
            // Démarrer la caméra
            await startCamera();
            
            // Initialiser l'overlay scan si en mode scan
            if (currentMode === 'scan') {
                initScanOverlay();
            }
            
            showLoading(false);
        } catch (error) {
            console.error('CameraCapture: Erreur initialisation', error);
            showError(true, getErrorMessage(error));
        }
    }

    /**
     * Liste les caméras disponibles
     */
    async function enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            // Mettre à jour le sélecteur si plusieurs caméras
            updateCameraSelector();
            
            // Trouver la caméra arrière par défaut
            if (currentFacingMode === 'environment') {
                const backCamera = availableCameras.findIndex(cam => 
                    cam.label.toLowerCase().includes('back') || 
                    cam.label.toLowerCase().includes('arrière') ||
                    cam.label.toLowerCase().includes('rear') ||
                    cam.label.toLowerCase().includes('environment')
                );
                if (backCamera !== -1) {
                    currentCameraIndex = backCamera;
                }
            }
        } catch (error) {
            console.warn('CameraCapture: Impossible de lister les caméras', error);
        }
    }

    /**
     * Met à jour le sélecteur de caméra
     */
    function updateCameraSelector() {
        const wrapper = document.getElementById('cameraSelectorWrapper');
        const select = document.getElementById('cameraSelectorSelect');
        const switchBtn = document.getElementById('cameraSwitchBtn');
        
        if (!wrapper || !select) return;
        
        const isDesktop = window.innerWidth > 768;
        
        // Sur desktop : afficher le sélecteur dès qu'il y a au moins 1 caméra
        // Sur mobile : afficher le bouton switch seulement s'il y a plusieurs caméras
        if (availableCameras.length >= 1) {
            // Remplir le select avec les vrais noms des caméras
            select.innerHTML = '';
            availableCameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = index;
                // Utiliser le vrai nom ou générer un nom plus descriptif
                option.textContent = formatCameraLabel(camera.label, index);
                if (index === currentCameraIndex) option.selected = true;
                select.appendChild(option);
            });
            
            // Sur desktop : toujours afficher le sélecteur
            if (isDesktop) {
                wrapper.style.display = 'flex';
                // Cacher le bouton switch sur desktop
                if (switchBtn) switchBtn.style.display = 'none';
            } else {
                // Sur mobile : cacher le sélecteur, utiliser le bouton switch
                wrapper.style.display = 'none';
                // Afficher le bouton switch seulement s'il y a plusieurs caméras
                if (switchBtn) {
                    switchBtn.style.display = availableCameras.length > 1 ? '' : 'none';
                }
            }
        } else {
            wrapper.style.display = 'none';
            if (switchBtn) switchBtn.style.display = 'none';
        }
    }
    
    /**
     * Formate le label d'une caméra pour l'affichage
     * @param {string} label - Label brut de la caméra
     * @param {number} index - Index de la caméra
     * @returns {string} Label formaté
     */
    function formatCameraLabel(label, index) {
        // Si pas de label, générer un nom générique
        if (!label || label.trim() === '') {
            return `${translations.camera || 'Caméra'} ${index + 1}`;
        }
        
        // Nettoyer le label (retirer les IDs techniques parfois présents)
        let cleanLabel = label.trim();
        
        // Retirer les préfixes techniques communs
        cleanLabel = cleanLabel.replace(/^\(.*?\)\s*/, '');
        
        // Détecter et traduire les termes courants
        const lowerLabel = cleanLabel.toLowerCase();
        
        // Identifier le type de caméra
        let cameraType = '';
        if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('avant') || lowerLabel.includes('selfie')) {
            cameraType = translations.front_camera || 'Avant';
        } else if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment') || lowerLabel.includes('arrière')) {
            cameraType = translations.back_camera || 'Arrière';
        } else if (lowerLabel.includes('wide') || lowerLabel.includes('grand angle')) {
            cameraType = translations.wide_camera || 'Grand angle';
        } else if (lowerLabel.includes('ultra') || lowerLabel.includes('macro')) {
            cameraType = translations.ultra_camera || 'Ultra grand angle';
        } else if (lowerLabel.includes('tele') || lowerLabel.includes('zoom')) {
            cameraType = translations.tele_camera || 'Téléobjectif';
        }
        
        // Si on a identifié un type, l'ajouter au label
        if (cameraType) {
            // Vérifier si le label contient déjà ce type
            if (!cleanLabel.toLowerCase().includes(cameraType.toLowerCase())) {
                return `${cleanLabel} (${cameraType})`;
            }
        }
        
        return cleanLabel;
    }

    /**
     * Démarre la caméra
     */
    async function startCamera() {
        // Arrêter le flux précédent
        stopCamera();

        // Construire les contraintes de base
        let constraints = {
            video: {
                facingMode: currentFacingMode,
            },
            audio: false
        };

        // Si on a un deviceId spécifique, l'utiliser
        if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
            constraints.video.deviceId = { exact: availableCameras[currentCameraIndex].deviceId };
            delete constraints.video.facingMode;
        }

        // Essayer avec les contraintes de résolution idéales d'abord
        const constraintsWithResolution = {
            ...constraints,
            video: {
                ...constraints.video,
                width: { ideal: CONFIG.preferredResolution.width.ideal },
                height: { ideal: CONFIG.preferredResolution.height.ideal }
            }
        };

        try {
            // Tentative 1: avec résolution idéale
            stream = await navigator.mediaDevices.getUserMedia(constraintsWithResolution);
        } catch (firstError) {
            // Tentative 2: sans contraintes de résolution
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (secondError) {
                // Tentative 3: contraintes minimales (juste vidéo)
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: false 
                    });
                } catch (thirdError) {
                    throw thirdError;
                }
            }
        }
        
        videoElement.srcObject = stream;
        
        // Attendre que la vidéo soit prête
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = resolve;
            videoElement.onerror = reject;
            setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        await videoElement.play();
        
        // Récupérer les capacités du track
        track = stream.getVideoTracks()[0];
        if (track) {
            capabilities = track.getCapabilities ? track.getCapabilities() : null;
            updateZoomCapabilities();
            updateFlashCapabilities();
        }
        
        // Re-énumérer les caméras après avoir obtenu la permission
        // (les labels sont souvent vides avant la permission)
        await refreshCameraList();
    }
    
    /**
     * Rafraîchit la liste des caméras (après avoir obtenu la permission)
     */
    async function refreshCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const newCameras = devices.filter(device => device.kind === 'videoinput');
            
            // Vérifier si les labels sont maintenant disponibles
            const hasLabels = newCameras.some(cam => cam.label && cam.label.trim() !== '');
            
            if (hasLabels && newCameras.length > 0) {
                // Conserver l'index actuel si possible
                const currentDeviceId = availableCameras[currentCameraIndex]?.deviceId;
                availableCameras = newCameras;
                
                // Retrouver l'index de la caméra actuelle
                if (currentDeviceId) {
                    const newIndex = availableCameras.findIndex(cam => cam.deviceId === currentDeviceId);
                    if (newIndex !== -1) {
                        currentCameraIndex = newIndex;
                    }
                }
                
                // Mettre à jour le sélecteur avec les vrais labels
                updateCameraSelector();
            }
        } catch (error) {
            console.warn('CameraCapture: Erreur lors du rafraîchissement des caméras', error);
        }
    }

    /**
     * Arrête la caméra
     */
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }
        track = null;
        capabilities = null;
    }

    /**
     * Met à jour les capacités de zoom
     */
    function updateZoomCapabilities() {
        const slider = document.getElementById('cameraZoomSlider');
        const indicator = document.getElementById('cameraZoomIndicator');
        
        if (!slider) return;

        if (capabilities && capabilities.zoom) {
            CONFIG.minZoom = capabilities.zoom.min || 1;
            CONFIG.maxZoom = capabilities.zoom.max || 5;
            slider.min = CONFIG.minZoom;
            slider.max = CONFIG.maxZoom;
            slider.value = currentZoom;
            slider.parentElement.style.display = '';
            if (indicator) indicator.style.display = '';
        } else {
            // Zoom non supporté par le hardware, utiliser le zoom CSS
            slider.parentElement.style.display = '';
            if (indicator) indicator.style.display = '';
        }
    }

    /**
     * Met à jour les capacités de flash
     */
    function updateFlashCapabilities() {
        const flashBtn = document.getElementById('cameraFlashBtn');
        if (!flashBtn) return;

        // Vérifier si le flash est supporté
        if (capabilities && capabilities.torch) {
            flashBtn.style.display = '';
        } else {
            // Cacher le bouton si pas de flash
            flashBtn.style.display = 'none';
        }
    }

    /**
     * Affiche/masque le loading
     */
    function showLoading(show) {
        const loading = document.getElementById('cameraLoading');
        if (loading) {
            loading.style.display = show ? '' : 'none';
        }
    }

    /**
     * Affiche/masque l'erreur
     */
    function showError(show, message = null) {
        const error = document.getElementById('cameraError');
        const errorMsg = document.getElementById('cameraErrorMessage');
        const loading = document.getElementById('cameraLoading');
        
        if (error) {
            error.style.display = show ? '' : 'none';
        }
        if (loading && show) {
            loading.style.display = 'none';
        }
        if (errorMsg && message) {
            errorMsg.textContent = message;
        }
    }

    /**
     * Retourne le message d'erreur approprié
     */
    function getErrorMessage(error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return translations.error_permission || 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres.';
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return translations.error_camera || 'Aucune caméra trouvée sur cet appareil.';
        }
        if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            return translations.error_camera || 'La caméra est peut-être utilisée par une autre application.';
        }
        return translations.error_camera || 'Impossible d\'accéder à la caméra.';
    }

    // === ÉVÉNEMENTS ===

    function attachEvents() {
        const overlay = document.querySelector(`[data-modal-id="${currentModalId}"]`);
        if (!overlay) return;

        // Bouton capture
        const captureBtn = document.getElementById('cameraCaptureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }

        // Bouton switch caméra
        const switchBtn = document.getElementById('cameraSwitchBtn');
        if (switchBtn) {
            switchBtn.addEventListener('click', switchCamera);
        }

        // Bouton flash
        const flashBtn = document.getElementById('cameraFlashBtn');
        if (flashBtn) {
            flashBtn.addEventListener('click', toggleFlash);
        }

        // Bouton retry
        const retryBtn = document.getElementById('cameraRetryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => initializeCamera());
        }

        // Sélecteur de caméra
        const cameraSelect = document.getElementById('cameraSelectorSelect');
        if (cameraSelect) {
            cameraSelect.addEventListener('change', (e) => {
                currentCameraIndex = parseInt(e.target.value);
                startCamera().catch(err => showError(true, getErrorMessage(err)));
            });
        }

        // Slider de zoom
        const zoomSlider = document.getElementById('cameraZoomSlider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                setZoom(parseFloat(e.target.value));
            });
        }

        // Boutons zoom +/-
        overlay.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action === 'zoom-in') {
                setZoom(currentZoom + CONFIG.zoomStep);
            } else if (action === 'zoom-out') {
                setZoom(currentZoom - CONFIG.zoomStep);
            } else if (action === 'cancel') {
                close();
            }
        });

        // Zoom molette
        const container = document.getElementById('cameraCaptureContainer');
        if (container) {
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -CONFIG.zoomStep : CONFIG.zoomStep;
                setZoom(currentZoom + delta);
            }, { passive: false });

            // Zoom pincement (tactile)
            let pinchStartDistance = 0;
            let pinchStartZoom = 1;

            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    pinchStartDistance = getDistance(e.touches[0], e.touches[1]);
                    pinchStartZoom = currentZoom;
                }
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const distance = getDistance(e.touches[0], e.touches[1]);
                    const scale = distance / pinchStartDistance;
                    setZoom(pinchStartZoom * scale);
                }
            }, { passive: false });
        }
    }

    /**
     * Calcule la distance entre deux touches
     */
    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Change de caméra
     */
    async function switchCamera() {
        if (availableCameras.length < 2) return;

        currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        
        // Alterner aussi le facingMode
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

        showLoading(true);
        try {
            await startCamera();
            showLoading(false);
        } catch (error) {
            showError(true, getErrorMessage(error));
        }

        // Mettre à jour le select
        const select = document.getElementById('cameraSelectorSelect');
        if (select) select.value = currentCameraIndex;
    }

    /**
     * Toggle le flash
     */
    async function toggleFlash() {
        if (!track || !capabilities?.torch) return;

        // Cycle: off -> on -> auto -> off
        const modes = ['off', 'on'];
        const currentIndex = modes.indexOf(flashMode);
        flashMode = modes[(currentIndex + 1) % modes.length];

        try {
            await track.applyConstraints({
                advanced: [{ torch: flashMode === 'on' }]
            });
        } catch (error) {
            console.warn('CameraCapture: Impossible de changer le flash', error);
        }

        updateFlashButton();
    }

    /**
     * Met à jour l'icône du bouton flash
     */
    function updateFlashButton() {
        const flashBtn = document.getElementById('cameraFlashBtn');
        if (!flashBtn) return;

        const icons = {
            'off': ICONS.flashOff,
            'on': ICONS.flashOn,
            'auto': ICONS.flashAuto
        };
        const titles = {
            'off': translations.flash_off || 'Flash désactivé',
            'on': translations.flash_on || 'Flash activé',
            'auto': translations.flash_auto || 'Flash auto'
        };

        flashBtn.innerHTML = icons[flashMode];
        flashBtn.title = titles[flashMode];
        flashBtn.classList.toggle('active', flashMode !== 'off');
    }

    /**
     * Définit le niveau de zoom
     */
    function setZoom(value) {
        currentZoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, value));

        // Appliquer le zoom hardware si supporté
        if (track && capabilities?.zoom) {
            try {
                track.applyConstraints({
                    advanced: [{ zoom: currentZoom }]
                });
            } catch (error) {
                console.warn('CameraCapture: Zoom hardware non supporté', error);
            }
        }

        // Appliquer aussi le zoom CSS comme fallback
        if (videoElement) {
            videoElement.style.transform = `scale(${currentZoom})`;
        }

        // Mettre à jour l'indicateur et le slider
        updateZoomIndicator();
        const slider = document.getElementById('cameraZoomSlider');
        if (slider) slider.value = currentZoom;
    }

    /**
     * Met à jour l'indicateur de zoom
     */
    function updateZoomIndicator() {
        const indicator = document.getElementById('cameraZoomValue');
        if (indicator) {
            indicator.textContent = `${currentZoom.toFixed(1)}x`;
        }

        // Afficher/masquer l'indicateur temporairement
        const container = document.getElementById('cameraZoomIndicator');
        if (container) {
            container.classList.add('visible');
            clearTimeout(container._hideTimeout);
            container._hideTimeout = setTimeout(() => {
                container.classList.remove('visible');
            }, 1500);
        }
    }

    /**
     * Prend une photo
     */
    async function capturePhoto() {
        if (!videoElement || !canvasElement || isCapturing) return;

        isCapturing = true;

        // Animation de capture
        const container = document.getElementById('cameraCaptureContainer');
        if (container) {
            container.classList.add('capturing');
            setTimeout(() => container.classList.remove('capturing'), 200);
        }

        try {
            // Dimensionner le canvas à la taille de la vidéo
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;
            canvasElement.width = videoWidth;
            canvasElement.height = videoHeight;

            // Dessiner la frame actuelle
            const ctx = canvasElement.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

            // Convertir en blob
            const blob = await new Promise((resolve, reject) => {
                canvasElement.toBlob(
                    (b) => b ? resolve(b) : reject(new Error('Échec conversion')),
                    CONFIG.photoFormat,
                    CONFIG.photoQuality
                );
            });

            // Sauvegarder l'état avant fermeture (car cleanup() le réinitialise)
            const savedState = { ...currentState };
            const savedModalId = currentModalId;
            
            // Fermer le modal caméra
            stopCamera();
            
            if (savedState.skipEditor) {
                // Retourner directement l'image
                if (typeof savedState.onCapture === 'function') {
                    savedState.onCapture({ blob, filename: `photo_${Date.now()}.jpg` });
                }
                ModalManager.close(savedModalId, 'capture');
            } else {
                // Ouvrir l'éditeur d'image
                ModalManager.close(savedModalId, 'capture');
                
                setTimeout(() => {
                    ImageEditor.open({
                        image: blob,
                        caller: savedState.caller,
                        targetField: savedState.targetField,
                        onSave: (result) => {
                            if (typeof savedState.onCapture === 'function') {
                                savedState.onCapture(result);
                            }
                        },
                        onCancel: () => {
                            if (typeof savedState.onCancel === 'function') {
                                savedState.onCancel();
                            }
                        },
                        ...savedState.editorOptions
                    });
                }, 100);
            }
        } catch (error) {
            console.error('CameraCapture: Erreur capture', error);
            if (typeof showToast === 'function') {
                showToast(translations.error_capture || 'Erreur lors de la capture', 'error');
            }
            isCapturing = false;
        }
    }

    /**
     * Ferme le modal
     */
    function close() {
        if (currentModalId) {
            ModalManager.close(currentModalId);
        }
    }

    /**
     * Nettoyage
     */
    function cleanup() {
        // Arrêter le scanner de code-barres
        stopBarcodeScanner();
        if (typeof BarcodeScanner !== 'undefined') {
            BarcodeScanner.destroy();
        }
        
        stopCamera();
        currentState = null;
        currentModalId = null;
        videoElement = null;
        canvasElement = null;
        barcodeScannerActive = false;
    }

    // === API PUBLIQUE ===

    return {
        open,
        close,
        config: CONFIG,
    };
})();

// Export pour utilisation globale
window.CameraCapture = CameraCapture;
