/**
 * DocumentViewer - Visionneuse de documents multi-format
 * 
 * Supporte : Images, PDF, Texte, ZIP, EPUB, CBZ, CBR
 * Utilise des librairies externes chargées dynamiquement.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const DocumentViewer = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        libsPath: '/assets/libs',
        supportedFormats: {
            image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
            pdf: ['pdf'],
            text: ['txt'],
            archive: ['zip'],
            epub: ['epub'],
            comic: ['cbz', 'cbr'],
            download: ['doc', 'docx', 'odt', 'ods', 'odp', 'odg']
        }
    };

    // === ÉTAT ===
    let currentModalId = null;
    let currentFile = null;
    let currentViewer = null;
    let libs = {
        pdfjs: { loaded: false, loading: false },
        jszip: { loaded: false, loading: false },
        epubjs: { loaded: false, loading: false },
        libarchive: { loaded: false, loading: false }
    };

    // === TRADUCTIONS ===
    let translations = {};

    // === ICÔNES SVG ===
    const ICONS = {
        close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        download: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        zoomIn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        zoomOut: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        zoomFit: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
        prevPage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
        nextPage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
        firstPage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>',
        lastPage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>',
        fullscreen: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
        exitFullscreen: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
        singlePage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="2"></rect></svg>',
        doublePage: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="9" height="18" rx="1"></rect><rect x="13" y="3" width="9" height="18" rx="1"></rect></svg>',
        folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
        image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        loading: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>',
        rotateLeft: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>',
        rotateRight: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>',
    };

    // === CHARGEMENT DES LIBRAIRIES ===

    /**
     * Charge une librairie dynamiquement
     */
    async function loadLib(name) {
        if (libs[name].loaded) return true;
        if (libs[name].loading) {
            // Attendre que le chargement en cours se termine
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (libs[name].loaded) {
                        clearInterval(check);
                        resolve(true);
                    }
                }, 100);
            });
        }

        libs[name].loading = true;

        try {
            switch (name) {
                case 'pdfjs':
                    await loadScript(`${CONFIG.libsPath}/pdfjs/pdf.min.js`);
                    // Configurer le worker
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CONFIG.libsPath}/pdfjs/pdf.worker.min.js`;
                    }
                    break;
                case 'jszip':
                    await loadScript(`${CONFIG.libsPath}/jszip/jszip.min.js`);
                    break;
                case 'epubjs':
                    await loadScript(`${CONFIG.libsPath}/epubjs/epub.min.js`);
                    break;
                case 'libarchive':
                    await loadScript(`${CONFIG.libsPath}/unrar/libarchive.js`);
                    // Initialiser avec le chemin du worker
                    if (window.Archive) {
                        window.Archive.init({
                            workerUrl: `${CONFIG.libsPath}/unrar/worker-bundle.js`
                        });
                    }
                    break;
            }
            libs[name].loaded = true;
            libs[name].loading = false;
            return true;
        } catch (error) {
            console.error(`DocumentViewer: Erreur chargement ${name}`, error);
            libs[name].loading = false;
            return false;
        }
    }

    /**
     * Charge un script JS
     */
    function loadScript(url, type = 'text/javascript') {
        return new Promise((resolve, reject) => {
            // Vérifier si déjà chargé
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            if (type === 'module') {
                script.type = 'module';
            }
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Échec chargement: ${url}`));
            document.head.appendChild(script);
        });
    }

    // === DÉTECTION DU TYPE ===

    /**
     * Détecte le type de viewer à utiliser
     */
    function getViewerType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        for (const [type, extensions] of Object.entries(CONFIG.supportedFormats)) {
            if (extensions.includes(ext)) {
                return { type, ext };
            }
        }
        
        return { type: 'unknown', ext };
    }

    // === INITIALISATION DES TRADUCTIONS ===

    function loadTranslations() {
        if (typeof window.__ === 'function') {
            translations = {
                title: __('document_viewer.title') || 'Visionneuse',
                loading: __('document_viewer.loading') || 'Chargement...',
                error: __('document_viewer.error') || 'Erreur de chargement',
                download: __('common.download') || 'Télécharger',
                close: __('common.close') || 'Fermer',
                page: __('document_viewer.page') || 'Page',
                of: __('document_viewer.of') || 'sur',
                zoom: __('document_viewer.zoom') || 'Zoom',
                single_page: __('document_viewer.single_page') || 'Page simple',
                double_page: __('document_viewer.double_page') || 'Double page',
                fullscreen: __('document_viewer.fullscreen') || 'Plein écran',
                exit_fullscreen: __('document_viewer.exit_fullscreen') || 'Quitter plein écran',
                extract: __('document_viewer.extract') || 'Extraire',
                extract_all: __('document_viewer.extract_all') || 'Tout extraire',
                files: __('document_viewer.files') || 'fichiers',
                folder: __('document_viewer.folder') || 'Dossier',
                unsupported: __('document_viewer.unsupported') || 'Format non prévisualisable',
                unsupported_desc: __('document_viewer.unsupported_desc') || 'Ce type de fichier ne peut pas être prévisualisé. Vous pouvez le télécharger.',
                rotate_left: __('document_viewer.rotate_left') || 'Rotation gauche',
                rotate_right: __('document_viewer.rotate_right') || 'Rotation droite',
                chapter: __('document_viewer.chapter') || 'Chapitre',
                toc: __('document_viewer.toc') || 'Table des matières',
            };
        }
    }

    // === POINT D'ENTRÉE PRINCIPAL ===

    /**
     * Ouvre un document dans la visionneuse
     * @param {string|Blob|File} source - URL, Blob ou File du document
     * @param {string} filename - Nom du fichier
     * @param {Object} options - Options supplémentaires
     */
    async function open(source, filename, options = {}) {
        loadTranslations();
        
        const { type, ext } = getViewerType(filename);
        
        currentFile = {
            source,
            filename,
            ext,
            type,
            url: typeof source === 'string' ? source : URL.createObjectURL(source)
        };

        // Ouvrir le modal approprié
        switch (type) {
            case 'image':
                await openImageViewer();
                break;
            case 'pdf':
                await openPDFViewer();
                break;
            case 'text':
                await openTextViewer();
                break;
            case 'archive':
                await openArchiveViewer();
                break;
            case 'epub':
                await openEpubViewer();
                break;
            case 'comic':
                await openComicViewer();
                break;
            case 'download':
                openDownloadDialog();
                break;
            default:
                openDownloadDialog();
        }

        return currentModalId;
    }

    /**
     * Ferme la visionneuse
     */
    function close() {
        if (currentViewer && currentViewer.destroy) {
            currentViewer.destroy();
        }
        currentViewer = null;
        
        // Libérer l'URL blob si créée
        if (currentFile && currentFile.url && typeof currentFile.source !== 'string') {
            URL.revokeObjectURL(currentFile.url);
        }
        currentFile = null;

        if (currentModalId) {
            ModalManager.close(currentModalId);
            currentModalId = null;
        }
    }

    // === VIEWER IMAGE ===

    async function openImageViewer() {
        const content = `
            <div class="docviewer docviewer-image">
                <div class="docviewer-container" id="docviewerContainer">
                    <img id="docviewerImage" src="${currentFile.url}" alt="${currentFile.filename}" draggable="false">
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="zoom-out" title="${translations.zoom} -">
                            ${ICONS.zoomOut}
                        </button>
                        <span class="docviewer-zoom-value" id="docviewerZoomValue">100%</span>
                        <button type="button" class="docviewer-btn" data-action="zoom-in" title="${translations.zoom} +">
                            ${ICONS.zoomIn}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="rotate-left" title="${translations.rotate_left}">
                            ${ICONS.rotateLeft}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="rotate-right" title="${translations.rotate_right}">
                            ${ICONS.rotateRight}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="fullscreen" title="${translations.fullscreen}">
                            ${ICONS.fullscreen}
                        </button>
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'fullscreen',
            customClass: 'modal-docviewer modal-docviewer-image',
            showFooter: false,
            closeOnOverlay: true,
            onOpen: () => initImageViewer(),
            onClose: () => cleanupViewer()
        });
    }

    function initImageViewer() {
        const container = document.getElementById('docviewerContainer');
        const img = document.getElementById('docviewerImage');
        const zoomValue = document.getElementById('docviewerZoomValue');
        
        if (!container || !img) return;

        let zoom = 1;
        let rotation = 0;
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;

        currentViewer = {
            zoom,
            rotation,
            destroy: () => {}
        };

        // Zoom
        function setZoom(newZoom) {
            zoom = Math.max(0.1, Math.min(5, newZoom));
            currentViewer.zoom = zoom;
            updateTransform();
            zoomValue.textContent = `${Math.round(zoom * 100)}%`;
        }

        function updateTransform() {
            img.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
        }

        // Événements
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(zoom + delta);
        }, { passive: false });

        // Drag pour pan
        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            startY = e.pageY - container.offsetTop;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            container.scrollLeft = scrollLeft - (x - startX);
            container.scrollTop = scrollTop - (y - startY);
        });

        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseleave', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        // Boutons toolbar
        document.querySelector('.modal-docviewer').addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'zoom-in':
                    setZoom(zoom + 0.25);
                    break;
                case 'zoom-out':
                    setZoom(zoom - 0.25);
                    break;
                case 'rotate-left':
                    rotation -= 90;
                    updateTransform();
                    break;
                case 'rotate-right':
                    rotation += 90;
                    updateTransform();
                    break;
                case 'fullscreen':
                    toggleFullscreen(container);
                    break;
            }
        });

        // Touch support
        let touchStartDistance = 0;
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchStartDistance = getTouchDistance(e.touches);
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const distance = getTouchDistance(e.touches);
                const scale = distance / touchStartDistance;
                setZoom(zoom * scale);
                touchStartDistance = distance;
            }
        }, { passive: true });
    }

    // === VIEWER PDF ===

    async function openPDFViewer() {
        const content = `
            <div class="docviewer docviewer-pdf">
                <div class="docviewer-loading" id="docviewerLoading">
                    <div class="loading-spinner"></div>
                    <p>${translations.loading}</p>
                </div>
                <div class="docviewer-container" id="docviewerContainer">
                    <canvas id="docviewerCanvas"></canvas>
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="first-page" title="Première page">
                            ${ICONS.firstPage}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="prev-page" title="Page précédente">
                            ${ICONS.prevPage}
                        </button>
                        <span class="docviewer-page-info">
                            <input type="number" id="docviewerPageInput" min="1" value="1" class="docviewer-page-input">
                            <span>${translations.of} <span id="docviewerTotalPages">-</span></span>
                        </span>
                        <button type="button" class="docviewer-btn" data-action="next-page" title="Page suivante">
                            ${ICONS.nextPage}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="last-page" title="Dernière page">
                            ${ICONS.lastPage}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="zoom-out" title="${translations.zoom} -">
                            ${ICONS.zoomOut}
                        </button>
                        <span class="docviewer-zoom-value" id="docviewerZoomValue">100%</span>
                        <button type="button" class="docviewer-btn" data-action="zoom-in" title="${translations.zoom} +">
                            ${ICONS.zoomIn}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="zoom-fit" title="${translations.fit || 'Ajuster'}">
                            ${ICONS.zoomFit}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'fullscreen',
            customClass: 'modal-docviewer modal-docviewer-pdf',
            showFooter: false,
            closeOnOverlay: true,
            onOpen: () => initPDFViewer(),
            onClose: () => cleanupViewer()
        });
    }

    async function initPDFViewer() {
        const loading = document.getElementById('docviewerLoading');
        const container = document.getElementById('docviewerContainer');
        const canvas = document.getElementById('docviewerCanvas');
        const pageInput = document.getElementById('docviewerPageInput');
        const totalPagesEl = document.getElementById('docviewerTotalPages');
        const zoomValue = document.getElementById('docviewerZoomValue');

        if (!await loadLib('pdfjs')) {
            showError('Impossible de charger la librairie PDF');
            return;
        }

        try {
            const pdf = await pdfjsLib.getDocument(currentFile.url).promise;
            let currentPage = 1;
            let zoom = 1;
            let initialScale = 1;
            const totalPages = pdf.numPages;

            totalPagesEl.textContent = totalPages;
            pageInput.max = totalPages;

            // Calculer le zoom initial pour que le PDF tienne dans le conteneur
            const firstPage = await pdf.getPage(1);
            const defaultViewport = firstPage.getViewport({ scale: 1 });
            const containerRect = container.getBoundingClientRect();
            const availableWidth = containerRect.width - 40; // Padding
            const availableHeight = containerRect.height - 40;
            
            // Calculer le scale pour tenir dans la zone visible
            const scaleWidth = availableWidth / defaultViewport.width;
            const scaleHeight = availableHeight / defaultViewport.height;
            initialScale = Math.min(scaleWidth, scaleHeight, 1); // Max 100%
            zoom = Math.max(0.3, Math.min(1, initialScale)); // Entre 30% et 100%

            currentViewer = {
                pdf,
                currentPage,
                zoom,
                destroy: () => {
                    pdf.destroy();
                }
            };

            async function renderPage(pageNum) {
                const page = await pdf.getPage(pageNum);
                // Scale de base pour bonne qualité (1.5x) multiplié par le zoom utilisateur
                const viewport = page.getViewport({ scale: zoom * 1.5 });
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Appliquer une taille CSS pour garder la taille visuelle cohérente
                canvas.style.width = `${viewport.width / 1.5}px`;
                canvas.style.height = `${viewport.height / 1.5}px`;
                
                const ctx = canvas.getContext('2d');
                await page.render({
                    canvasContext: ctx,
                    viewport
                }).promise;

                pageInput.value = pageNum;
                currentViewer.currentPage = pageNum;
            }

            function setZoom(newZoom) {
                zoom = Math.max(0.25, Math.min(4, newZoom));
                currentViewer.zoom = zoom;
                zoomValue.textContent = `${Math.round(zoom * 100)}%`;
                renderPage(currentViewer.currentPage);
            }

            // Première page avec zoom initial
            zoomValue.textContent = `${Math.round(zoom * 100)}%`;
            await renderPage(1);
            loading.style.display = 'none';

            // Événements
            document.querySelector('.modal-docviewer').addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (!action) return;

                switch (action) {
                    case 'first-page':
                        renderPage(1);
                        break;
                    case 'prev-page':
                        if (currentViewer.currentPage > 1) renderPage(currentViewer.currentPage - 1);
                        break;
                    case 'next-page':
                        if (currentViewer.currentPage < totalPages) renderPage(currentViewer.currentPage + 1);
                        break;
                    case 'last-page':
                        renderPage(totalPages);
                        break;
                    case 'zoom-in':
                        setZoom(zoom + 0.25);
                        break;
                    case 'zoom-out':
                        setZoom(zoom - 0.25);
                        break;
                    case 'zoom-fit':
                        // Recalculer le zoom pour ajuster à la zone visible
                        setZoom(initialScale);
                        break;
                }
            });

            pageInput.addEventListener('change', () => {
                const page = parseInt(pageInput.value);
                if (page >= 1 && page <= totalPages) {
                    renderPage(page);
                }
            });

            // Navigation clavier
            document.addEventListener('keydown', handlePDFKeyboard);
            currentViewer.destroy = () => {
                document.removeEventListener('keydown', handlePDFKeyboard);
                pdf.destroy();
            };

            function handlePDFKeyboard(e) {
                if (e.key === 'ArrowLeft' && currentViewer.currentPage > 1) {
                    renderPage(currentViewer.currentPage - 1);
                } else if (e.key === 'ArrowRight' && currentViewer.currentPage < totalPages) {
                    renderPage(currentViewer.currentPage + 1);
                }
            }

        } catch (error) {
            console.error('PDF error:', error);
            showError('Erreur lors du chargement du PDF');
        }
    }

    // === VIEWER TEXTE ===

    async function openTextViewer() {
        const content = `
            <div class="docviewer docviewer-text">
                <div class="docviewer-loading" id="docviewerLoading">
                    <div class="loading-spinner"></div>
                    <p>${translations.loading}</p>
                </div>
                <div class="docviewer-container" id="docviewerContainer">
                    <pre id="docviewerText" class="docviewer-text-content"></pre>
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'fullscreen',
            customClass: 'modal-docviewer modal-docviewer-text',
            showFooter: false,
            closeOnOverlay: true,
            onOpen: () => initTextViewer(),
            onClose: () => cleanupViewer()
        });
    }

    async function initTextViewer() {
        const loading = document.getElementById('docviewerLoading');
        const textEl = document.getElementById('docviewerText');

        try {
            const response = await fetch(currentFile.url);
            const text = await response.text();
            textEl.textContent = text;
            loading.style.display = 'none';
            
            currentViewer = { destroy: () => {} };
        } catch (error) {
            console.error('Text error:', error);
            showError('Erreur lors du chargement du fichier');
        }
    }

    // === VIEWER ARCHIVE (ZIP) ===

    async function openArchiveViewer() {
        const content = `
            <div class="docviewer docviewer-archive">
                <div class="docviewer-loading" id="docviewerLoading">
                    <div class="loading-spinner"></div>
                    <p>${translations.loading}</p>
                </div>
                <div class="docviewer-container" id="docviewerContainer">
                    <div class="docviewer-archive-header">
                        <span class="archive-info" id="archiveInfo"></span>
                        <button type="button" class="btn btn-primary btn-sm" id="extractAllBtn">
                            ${ICONS.download} ${translations.extract_all}
                        </button>
                    </div>
                    <div class="docviewer-archive-tree" id="archiveTree"></div>
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'modal-lg',
            customClass: 'modal-docviewer modal-docviewer-archive',
            showFooter: false,
            closeOnOverlay: true,
            onOpen: () => initArchiveViewer(),
            onClose: () => cleanupViewer()
        });
    }

    async function initArchiveViewer() {
        const loading = document.getElementById('docviewerLoading');
        const treeEl = document.getElementById('archiveTree');
        const infoEl = document.getElementById('archiveInfo');
        const extractAllBtn = document.getElementById('extractAllBtn');

        if (!await loadLib('jszip')) {
            showError('Impossible de charger la librairie ZIP');
            return;
        }

        try {
            let data;
            if (typeof currentFile.source === 'string') {
                const response = await fetch(currentFile.url);
                data = await response.arrayBuffer();
            } else {
                data = await currentFile.source.arrayBuffer();
            }

            const zip = await JSZip.loadAsync(data);
            const files = [];
            
            zip.forEach((path, file) => {
                files.push({
                    path,
                    name: path.split('/').pop() || path,
                    isDir: file.dir,
                    size: file._data ? file._data.uncompressedSize : 0,
                    file
                });
            });

            // Trier : dossiers d'abord, puis fichiers
            files.sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.path.localeCompare(b.path);
            });

            infoEl.textContent = `${files.length} ${translations.files}`;
            loading.style.display = 'none';

            // Construire l'arbre
            treeEl.innerHTML = files.map(f => `
                <div class="archive-item ${f.isDir ? 'archive-folder' : 'archive-file'}" data-path="${f.path}">
                    <span class="archive-icon">${f.isDir ? ICONS.folder : getFileIcon(f.name)}</span>
                    <span class="archive-name">${f.path}</span>
                    ${!f.isDir ? `
                        <span class="archive-size">${formatSize(f.size)}</span>
                        <button type="button" class="archive-extract-btn" data-extract="${f.path}" title="${translations.extract}">
                            ${ICONS.download}
                        </button>
                    ` : ''}
                </div>
            `).join('');

            currentViewer = {
                zip,
                files,
                destroy: () => {}
            };

            // Extraction fichier individuel
            treeEl.addEventListener('click', async (e) => {
                const extractBtn = e.target.closest('[data-extract]');
                if (extractBtn) {
                    const path = extractBtn.dataset.extract;
                    const file = zip.file(path);
                    if (file) {
                        const blob = await file.async('blob');
                        downloadBlob(blob, path.split('/').pop());
                    }
                }

                // Prévisualiser les images
                const item = e.target.closest('.archive-file');
                if (item && !extractBtn) {
                    const path = item.dataset.path;
                    const ext = path.split('.').pop().toLowerCase();
                    if (CONFIG.supportedFormats.image.includes(ext)) {
                        const file = zip.file(path);
                        if (file) {
                            const blob = await file.async('blob');
                            // Ouvrir dans une nouvelle visionneuse
                            DocumentViewer.open(blob, path.split('/').pop());
                        }
                    }
                }
            });

            // Extraction totale
            extractAllBtn.addEventListener('click', async () => {
                // Créer un nouveau ZIP avec tout le contenu extrait
                const blob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(blob, currentFile.filename);
            });

        } catch (error) {
            console.error('Archive error:', error);
            showError('Erreur lors du chargement de l\'archive');
        }
    }

    // === VIEWER EPUB ===

    async function openEpubViewer() {
        const content = `
            <div class="docviewer docviewer-epub">
                <div class="docviewer-loading" id="docviewerLoading">
                    <div class="loading-spinner"></div>
                    <p>${translations.loading}</p>
                </div>
                <div class="docviewer-sidebar" id="docviewerSidebar">
                    <h3>${translations.toc}</h3>
                    <div id="epubToc"></div>
                </div>
                <div class="docviewer-container" id="docviewerContainer">
                    <div id="epubViewer"></div>
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="prev-chapter" title="Chapitre précédent">
                            ${ICONS.prevPage}
                        </button>
                        <span class="docviewer-chapter-info" id="epubChapterInfo">-</span>
                        <button type="button" class="docviewer-btn" data-action="next-chapter" title="Chapitre suivant">
                            ${ICONS.nextPage}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="toggle-toc" title="${translations.toc}">
                            ${ICONS.folder}
                        </button>
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'fullscreen',
            customClass: 'modal-docviewer modal-docviewer-epub',
            showFooter: false,
            closeOnOverlay: true,
            onOpen: () => initEpubViewer(),
            onClose: () => cleanupViewer()
        });
    }

    async function initEpubViewer() {
        const loading = document.getElementById('docviewerLoading');
        const container = document.getElementById('epubViewer');
        const tocEl = document.getElementById('epubToc');
        const chapterInfo = document.getElementById('epubChapterInfo');
        const sidebar = document.getElementById('docviewerSidebar');

        if (!await loadLib('epubjs')) {
            showError('Impossible de charger la librairie EPUB');
            return;
        }

        try {
            const book = ePub(currentFile.url);
            const rendition = book.renderTo(container, {
                width: '100%',
                height: '100%',
                spread: 'none'
            });

            await rendition.display();
            loading.style.display = 'none';

            // Table des matières
            const toc = await book.loaded.navigation;
            if (toc.toc) {
                tocEl.innerHTML = toc.toc.map(chapter => `
                    <div class="epub-toc-item" data-href="${chapter.href}">
                        ${chapter.label}
                    </div>
                `).join('');
            }

            currentViewer = {
                book,
                rendition,
                destroy: () => {
                    book.destroy();
                }
            };

            // Événements
            document.querySelector('.modal-docviewer').addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                const tocItem = e.target.closest('.epub-toc-item');

                if (tocItem) {
                    rendition.display(tocItem.dataset.href);
                    sidebar.classList.remove('visible');
                }

                if (!action) return;

                switch (action) {
                    case 'prev-chapter':
                        rendition.prev();
                        break;
                    case 'next-chapter':
                        rendition.next();
                        break;
                    case 'toggle-toc':
                        sidebar.classList.toggle('visible');
                        break;
                }
            });

            // Mise à jour du chapitre courant
            rendition.on('relocated', (location) => {
                const chapter = book.navigation.get(location.start.href);
                if (chapter) {
                    chapterInfo.textContent = chapter.label;
                }
            });

            // Navigation clavier
            document.addEventListener('keydown', handleEpubKeyboard);
            currentViewer.destroy = () => {
                document.removeEventListener('keydown', handleEpubKeyboard);
                book.destroy();
            };

            function handleEpubKeyboard(e) {
                if (e.key === 'ArrowLeft') rendition.prev();
                if (e.key === 'ArrowRight') rendition.next();
            }

        } catch (error) {
            console.error('EPUB error:', error);
            showError('Erreur lors du chargement de l\'EPUB');
        }
    }

    // === VIEWER COMIC (CBZ/CBR) ===

    async function openComicViewer() {
        const content = `
            <div class="docviewer docviewer-comic">
                <div class="docviewer-loading" id="docviewerLoading">
                    <div class="loading-spinner"></div>
                    <p>${translations.loading}</p>
                </div>
                <div class="docviewer-container" id="docviewerContainer">
                    <div class="comic-pages" id="comicPages"></div>
                </div>
                <div class="docviewer-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="first-page" title="Première page">
                            ${ICONS.firstPage}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="prev-page" title="Page précédente">
                            ${ICONS.prevPage}
                        </button>
                        <span class="docviewer-page-info">
                            <span id="comicCurrentPage">1</span> ${translations.of} <span id="comicTotalPages">-</span>
                        </span>
                        <button type="button" class="docviewer-btn" data-action="next-page" title="Page suivante">
                            ${ICONS.nextPage}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="last-page" title="Dernière page">
                            ${ICONS.lastPage}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="single-page" title="${translations.single_page}">
                            ${ICONS.singlePage}
                        </button>
                        <button type="button" class="docviewer-btn" data-action="double-page" title="${translations.double_page}">
                            ${ICONS.doublePage}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="zoom-out" title="${translations.zoom} -">
                            ${ICONS.zoomOut}
                        </button>
                        <span class="docviewer-zoom-value" id="docviewerZoomValue">Fit</span>
                        <button type="button" class="docviewer-btn" data-action="zoom-in" title="${translations.zoom} +">
                            ${ICONS.zoomIn}
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="docviewer-btn" data-action="fullscreen" title="${translations.fullscreen}">
                            ${ICONS.fullscreen}
                        </button>
                        <a href="${currentFile.url}" download="${currentFile.filename}" class="docviewer-btn" title="${translations.download}">
                            ${ICONS.download}
                        </a>
                    </div>
                </div>
                <div class="comic-nav comic-nav-prev" data-action="prev-page"></div>
                <div class="comic-nav comic-nav-next" data-action="next-page"></div>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: currentFile.filename,
            content,
            size: 'fullscreen',
            customClass: 'modal-docviewer modal-docviewer-comic',
            showFooter: false,
            closeOnOverlay: false,
            onOpen: () => initComicViewer(),
            onClose: () => cleanupViewer()
        });
    }

    async function initComicViewer() {
        const loading = document.getElementById('docviewerLoading');
        const pagesContainer = document.getElementById('comicPages');
        const currentPageEl = document.getElementById('comicCurrentPage');
        const totalPagesEl = document.getElementById('comicTotalPages');
        const zoomValue = document.getElementById('docviewerZoomValue');
        const container = document.getElementById('docviewerContainer');

        const isCBR = currentFile.ext === 'cbr';
        
        // Charger la bonne librairie
        if (isCBR) {
            if (!await loadLib('libarchive')) {
                showError('Impossible de charger la librairie RAR');
                return;
            }
        } else {
            if (!await loadLib('jszip')) {
                showError('Impossible de charger la librairie ZIP');
                return;
            }
        }

        try {
            let images = [];
            
            if (isCBR) {
                // Utiliser libarchive pour CBR
                const archive = await Archive.open(currentFile.source || await fetch(currentFile.url).then(r => r.blob()));
                const files = await archive.getFilesArray();
                
                for (const entry of files) {
                    const ext = entry.file.name.split('.').pop().toLowerCase();
                    if (CONFIG.supportedFormats.image.includes(ext)) {
                        const file = await entry.file.extract();
                        images.push({
                            name: entry.file.name,
                            url: URL.createObjectURL(file)
                        });
                    }
                }
            } else {
                // Utiliser JSZip pour CBZ
                let data;
                if (typeof currentFile.source === 'string') {
                    const response = await fetch(currentFile.url);
                    data = await response.arrayBuffer();
                } else {
                    data = await currentFile.source.arrayBuffer();
                }

                const zip = await JSZip.loadAsync(data);
                
                const imageFiles = [];
                zip.forEach((path, file) => {
                    if (!file.dir) {
                        const ext = path.split('.').pop().toLowerCase();
                        if (CONFIG.supportedFormats.image.includes(ext)) {
                            imageFiles.push({ path, file });
                        }
                    }
                });

                // Trier par nom
                imageFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));

                for (const { path, file } of imageFiles) {
                    const blob = await file.async('blob');
                    images.push({
                        name: path,
                        url: URL.createObjectURL(blob)
                    });
                }
            }

            if (images.length === 0) {
                showError('Aucune image trouvée dans l\'archive');
                return;
            }

            // État
            let currentPage = 0;
            let doublePageMode = false;
            let zoom = 'fit'; // 'fit', number

            currentViewer = {
                images,
                currentPage,
                doublePageMode,
                destroy: () => {
                    images.forEach(img => URL.revokeObjectURL(img.url));
                }
            };

            totalPagesEl.textContent = images.length;
            loading.style.display = 'none';

            function renderPage() {
                pagesContainer.innerHTML = '';
                
                if (doublePageMode && currentPage < images.length - 1) {
                    // Double page
                    pagesContainer.innerHTML = `
                        <img src="${images[currentPage].url}" alt="Page ${currentPage + 1}" class="comic-page">
                        <img src="${images[currentPage + 1].url}" alt="Page ${currentPage + 2}" class="comic-page">
                    `;
                    currentPageEl.textContent = `${currentPage + 1}-${currentPage + 2}`;
                } else {
                    // Page simple
                    pagesContainer.innerHTML = `
                        <img src="${images[currentPage].url}" alt="Page ${currentPage + 1}" class="comic-page">
                    `;
                    currentPageEl.textContent = currentPage + 1;
                }

                // Appliquer le zoom
                if (zoom !== 'fit') {
                    pagesContainer.querySelectorAll('.comic-page').forEach(img => {
                        img.style.width = `${zoom * 100}%`;
                        img.style.height = 'auto';
                    });
                }
            }

            function goToPage(page) {
                currentPage = Math.max(0, Math.min(images.length - 1, page));
                currentViewer.currentPage = currentPage;
                renderPage();
            }

            function nextPage() {
                const step = doublePageMode ? 2 : 1;
                if (currentPage + step < images.length) {
                    goToPage(currentPage + step);
                }
            }

            function prevPage() {
                const step = doublePageMode ? 2 : 1;
                goToPage(currentPage - step);
            }

            // Première page
            renderPage();

            // Événements
            document.querySelector('.modal-docviewer').addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (!action) return;

                switch (action) {
                    case 'first-page':
                        goToPage(0);
                        break;
                    case 'prev-page':
                        prevPage();
                        break;
                    case 'next-page':
                        nextPage();
                        break;
                    case 'last-page':
                        goToPage(images.length - 1);
                        break;
                    case 'single-page':
                        doublePageMode = false;
                        currentViewer.doublePageMode = false;
                        renderPage();
                        break;
                    case 'double-page':
                        doublePageMode = true;
                        currentViewer.doublePageMode = true;
                        // S'assurer de commencer sur une page paire
                        if (currentPage % 2 !== 0) currentPage--;
                        renderPage();
                        break;
                    case 'zoom-in':
                        if (zoom === 'fit') zoom = 1;
                        zoom = Math.min(3, zoom + 0.25);
                        zoomValue.textContent = `${Math.round(zoom * 100)}%`;
                        renderPage();
                        break;
                    case 'zoom-out':
                        if (zoom === 'fit') zoom = 1;
                        zoom = Math.max(0.25, zoom - 0.25);
                        if (zoom === 1) {
                            zoom = 'fit';
                            zoomValue.textContent = 'Fit';
                        } else {
                            zoomValue.textContent = `${Math.round(zoom * 100)}%`;
                        }
                        renderPage();
                        break;
                    case 'fullscreen':
                        toggleFullscreen(container);
                        break;
                }
            });

            // Navigation clavier
            document.addEventListener('keydown', handleComicKeyboard);
            currentViewer.destroy = () => {
                document.removeEventListener('keydown', handleComicKeyboard);
                images.forEach(img => URL.revokeObjectURL(img.url));
            };

            function handleComicKeyboard(e) {
                if (e.key === 'ArrowLeft') prevPage();
                if (e.key === 'ArrowRight') nextPage();
                if (e.key === 'Home') goToPage(0);
                if (e.key === 'End') goToPage(images.length - 1);
            }

            // Swipe sur mobile
            let touchStartX = 0;
            container.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) nextPage();
                    else prevPage();
                }
            }, { passive: true });

        } catch (error) {
            console.error('Comic error:', error);
            showError('Erreur lors du chargement du comic');
        }
    }

    // === DIALOG TÉLÉCHARGEMENT ===

    function openDownloadDialog() {
        const content = `
            <div class="docviewer-download">
                <div class="download-icon">
                    ${getFileTypeIcon(currentFile.ext)}
                </div>
                <h3>${currentFile.filename}</h3>
                <p>${translations.unsupported_desc}</p>
                <a href="${currentFile.url}" download="${currentFile.filename}" class="btn btn-primary">
                    ${ICONS.download} ${translations.download}
                </a>
            </div>
        `;

        currentModalId = ModalManager.open({
            title: translations.unsupported,
            content,
            size: 'modal-sm',
            customClass: 'modal-docviewer modal-docviewer-download',
            showFooter: false,
            closeOnOverlay: true
        });
    }

    // === UTILITAIRES ===

    function cleanupViewer() {
        if (currentViewer && currentViewer.destroy) {
            currentViewer.destroy();
        }
        currentViewer = null;
        
        if (currentFile && currentFile.url && typeof currentFile.source !== 'string') {
            URL.revokeObjectURL(currentFile.url);
        }
        currentFile = null;
        currentModalId = null;
    }

    function showError(message) {
        const loading = document.getElementById('docviewerLoading');
        if (loading) {
            loading.innerHTML = `
                <div class="docviewer-error">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    function toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                console.warn('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    function getTouchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (CONFIG.supportedFormats.image.includes(ext)) return ICONS.image;
        return ICONS.file;
    }

    function getFileTypeIcon(ext) {
        const iconMap = {
            doc: '📄', docx: '📄',
            odt: '📄', ods: '📊', odp: '📽️', odg: '🎨',
        };
        return `<span class="file-type-icon">${iconMap[ext] || '📁'}</span>`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // === API PUBLIQUE ===
    return {
        open,
        close,
        
        /**
         * Vérifie si un format est supporté pour la prévisualisation
         */
        isSupported(filename) {
            const { type } = getViewerType(filename);
            return type !== 'unknown' && type !== 'download';
        },
        
        /**
         * Retourne le type de viewer pour un fichier
         */
        getType(filename) {
            return getViewerType(filename);
        }
    };

})();

// Export pour usage global
window.DocumentViewer = DocumentViewer;
