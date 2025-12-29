/**
 * MediaListManager - Gestionnaire de listes de médias réutilisable
 * 
 * Module permettant de gérer des listes de fichiers (images, vidéos, audios, documents)
 * avec support du drag & drop, réorganisation, prévisualisation et suppression.
 * 
 * Conçu pour être réutilisé dans les modals de catégories et d'items.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const MediaListManager = (function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        // Types de médias supportés
        types: {
            images: {
                accept: 'image/*',
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
                icon: '🖼️',
                useImageEditor: true,
                displayMode: 'thumbnail'
            },
            videos: {
                accept: 'video/*',
                extensions: ['mp4', 'webm', 'avi', 'mkv', 'mov'],
                icon: '🎬',
                useImageEditor: false,
                displayMode: 'thumbnail', // Thumbnail généré par ffmpeg
                generateThumbnail: true
            },
            audio: {
                accept: 'audio/*',
                extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
                icon: '🎵',
                useImageEditor: false,
                displayMode: 'icon',
                hasPlayer: true
            },
            documents: {
                accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.xls,.xlsx',
                extensions: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', '7z', 'xls', 'xlsx', 'odt', 'rtf'],
                icon: '📄',
                useImageEditor: false,
                displayMode: 'icon'
            }
        },
        // Icônes par extension
        extensionIcons: {
            // Documents
            pdf: '📕',
            doc: '📘', docx: '📘',
            xls: '📗', xlsx: '📗',
            txt: '📝',
            rtf: '📝',
            odt: '📘',
            // Archives
            zip: '📦', rar: '📦', '7z': '📦',
            // Audio
            mp3: '🎵', wav: '🎶', ogg: '🎵', flac: '🎼', m4a: '🎵',
            // Vidéo
            mp4: '🎬', webm: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
            // Images
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', bmp: '🖼️',
            // Défaut
            default: '📄'
        },
        // Taille des thumbnails
        thumbnailSize: 100,
        // Délai pour le debounce du réordonnancement
        reorderDebounce: 500
    };

    // ========================================
    // État global
    // ========================================
    const instances = new Map(); // Stockage des instances par ID
    let instanceCounter = 0;

    // ========================================
    // Traductions
    // ========================================
    let translations = {};

    function loadTranslations() {
        if (typeof window.__ === 'function') {
            translations = {
                add_files: __('media.add_files') || 'Ajouter des fichiers',
                drag_drop: __('media.drag_drop') || 'Glissez-déposez ou cliquez ici',
                delete_all: __('media.delete_all') || 'Tout supprimer',
                delete_confirm: __('media.delete_confirm') || 'Supprimer ce fichier ?',
                delete_all_confirm: __('media.delete_all_confirm') || 'Supprimer tous les fichiers ?',
                no_files: __('media.no_files') || 'Aucun fichier',
                uploading: __('media.uploading') || 'Upload en cours...',
                processing: __('media.processing') || 'Traitement...',
                error_upload: __('media.error_upload') || 'Erreur lors de l\'upload',
                error_type: __('media.error_type') || 'Type de fichier non autorisé',
                error_size: __('media.error_size') || 'Fichier trop volumineux',
                play: __('media.play') || 'Lecture',
                pause: __('media.pause') || 'Pause',
                view: __('media.view') || 'Voir',
                download: __('media.download') || 'Télécharger',
                edit: __('media.edit') || 'Modifier',
                images: __('media.images') || 'Images',
                videos: __('media.videos') || 'Vidéos',
                audio: __('media.audio') || 'Audio',
                documents: __('media.documents') || 'Documents'
            };
        } else {
            // Traductions par défaut
            translations = {
                add_files: 'Ajouter des fichiers',
                drag_drop: 'Glissez-déposez ou cliquez ici',
                delete_all: 'Tout supprimer',
                delete_confirm: 'Supprimer ce fichier ?',
                delete_all_confirm: 'Supprimer tous les fichiers ?',
                no_files: 'Aucun fichier',
                uploading: 'Upload en cours...',
                processing: 'Traitement...',
                error_upload: 'Erreur lors de l\'upload',
                error_type: 'Type de fichier non autorisé',
                error_size: 'Fichier trop volumineux',
                play: 'Lecture',
                pause: 'Pause',
                view: 'Voir',
                download: 'Télécharger',
                edit: 'Modifier',
                images: 'Images',
                videos: 'Vidéos',
                audio: 'Audio',
                documents: 'Documents'
            };
        }
    }

    // ========================================
    // Icônes SVG
    // ========================================
    const ICONS = {
        add: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        delete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        deleteAll: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
        play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        pause: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
        drag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>',
        upload: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        view: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>'
    };

    // ========================================
    // Lazy Loading - Intersection Observer
    // ========================================
    let lazyBgObserver = null;
    
    /**
     * Initialise l'Intersection Observer global pour le lazy loading des background-images
     */
    function initLazyBgObserver() {
        if (lazyBgObserver) return lazyBgObserver;
        
        if ('IntersectionObserver' in window) {
            lazyBgObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const bgUrl = el.dataset.bg;
                        if (bgUrl) {
                            el.style.backgroundImage = `url('${bgUrl}')`;
                            el.classList.remove('lazy-bg');
                            el.classList.add('lazy-bg-loaded');
                            delete el.dataset.bg;
                        }
                        lazyBgObserver.unobserve(el);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
        return lazyBgObserver;
    }
    
    /**
     * Ajoute un élément à l'observation pour lazy loading
     * @param {HTMLElement} element - Élément avec data-bg à charger
     */
    function observeLazyBg(element) {
        const observer = initLazyBgObserver();
        if (observer) {
            observer.observe(element);
        } else {
            // Fallback : charger immédiatement
            const bgUrl = element.dataset.bg;
            if (bgUrl) {
                element.style.backgroundImage = `url('${bgUrl}')`;
                element.classList.remove('lazy-bg');
            }
        }
    }

    // ========================================
    // Classe MediaListManager
    // ========================================
    class MediaList {
        /**
         * Crée une nouvelle instance de liste de médias
         * @param {Object} options - Options de configuration
         * @param {string} options.container - Sélecteur ou élément du conteneur
         * @param {string} options.type - Type de média (images, videos, audio, documents)
         * @param {string} options.apiEndpoint - URL de l'API pour les opérations CRUD
         * @param {string} options.entityType - Type d'entité (category, item)
         * @param {number} options.entityId - ID de l'entité (null si création)
         * @param {number} options.userId - ID de l'utilisateur
         * @param {boolean} options.isDefault - Est-ce une catégorie par défaut (admin)
         * @param {Function} options.onFilesChange - Callback quand la liste change
         * @param {Function} options.onError - Callback en cas d'erreur
         * @param {boolean} options.readonly - Mode lecture seule
         */
        constructor(options) {
            this.id = `media-list-${++instanceCounter}`;
            this.type = options.type || 'images';
            this.typeConfig = CONFIG.types[this.type] || CONFIG.types.images;
            this.apiEndpoint = options.apiEndpoint || '/api/category-media.php';
            this.entityType = options.entityType || 'category';
            this.entityId = options.entityId || null;
            this.userId = options.userId || null;
            this.isDefault = options.isDefault || false;
            this.onFilesChange = options.onFilesChange || null;
            this.onError = options.onError || null;
            this.readonly = options.readonly || false;

            // État
            this.files = []; // Liste des fichiers { id, filename, path, thumbnailPath, order, tempId? }
            this.pendingFiles = []; // Fichiers en attente d'upload (mode création)
            this.draggedItem = null;
            this.audioPlayer = null;
            this.currentPlayingId = null;

            // Éléments DOM
            this.container = typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container;

            if (!this.container) {
                console.error('MediaListManager: Container not found');
                return;
            }

            // Charger les traductions
            loadTranslations();

            // Initialiser
            this.render();
            this.attachEvents();

            // Stocker l'instance
            instances.set(this.id, this);
        }

        /**
         * Génère le HTML de la liste
         */
        render() {
            const typeLabel = translations[this.type] || this.type;

            this.container.innerHTML = `
                <div class="media-list" id="${this.id}" data-type="${this.type}">
                    <div class="media-list-header">
                        <h4 class="media-list-title">
                            <span class="media-type-icon">${this.typeConfig.icon}</span>
                            ${typeLabel}
                            <span class="media-count">(0)</span>
                        </h4>
                        <div class="media-list-actions">
                            ${!this.readonly ? `
                                <button type="button" class="btn btn-sm btn-secondary media-add-btn" title="${translations.add_files}">
                                    ${ICONS.add}
                                    <span class="btn-text">${translations.add_files}</span>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger media-delete-all-btn" title="${translations.delete_all}" style="display: none;">
                                    ${ICONS.deleteAll}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="media-list-dropzone" data-active="false">
                        <div class="dropzone-content">
                            ${ICONS.upload}
                            <span>${translations.drag_drop}</span>
                        </div>
                    </div>
                    
                    <div class="media-list-items">
                        <div class="media-list-empty">
                            <span>${translations.no_files}</span>
                        </div>
                    </div>
                    
                    ${this.typeConfig.hasPlayer ? `
                        <div class="media-audio-player" style="display: none;">
                            <audio id="${this.id}-audio" preload="metadata"></audio>
                            <div class="audio-player-controls">
                                <button type="button" class="audio-play-btn">${ICONS.play}</button>
                                <div class="audio-progress">
                                    <div class="audio-progress-bar"></div>
                                </div>
                                <span class="audio-time">0:00 / 0:00</span>
                            </div>
                            <div class="audio-filename"></div>
                        </div>
                    ` : ''}
                    
                    <input type="file" class="media-file-input" 
                           accept="${this.typeConfig.accept}" 
                           multiple 
                           style="display: none;">
                </div>
            `;

            // Références aux éléments
            this.listElement = this.container.querySelector('.media-list');
            this.itemsContainer = this.container.querySelector('.media-list-items');
            this.dropzone = this.container.querySelector('.media-list-dropzone');
            this.fileInput = this.container.querySelector('.media-file-input');
            this.addBtn = this.container.querySelector('.media-add-btn');
            this.deleteAllBtn = this.container.querySelector('.media-delete-all-btn');
            this.countElement = this.container.querySelector('.media-count');
            this.emptyElement = this.container.querySelector('.media-list-empty');

            if (this.typeConfig.hasPlayer) {
                this.audioPlayer = this.container.querySelector(`#${this.id}-audio`);
                this.playerContainer = this.container.querySelector('.media-audio-player');
                this.playBtn = this.container.querySelector('.audio-play-btn');
                this.progressBar = this.container.querySelector('.audio-progress-bar');
                this.timeDisplay = this.container.querySelector('.audio-time');
                this.filenameDisplay = this.container.querySelector('.audio-filename');
            }
        }

        /**
         * Attache les événements
         */
        attachEvents() {
            if (this.readonly) return;

            // Bouton d'ajout
            if (this.addBtn) {
                this.addBtn.addEventListener('click', () => this.fileInput.click());
            }

            // Input fichier
            if (this.fileInput) {
                this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
            }

            // Clic sur la zone de drop pour ouvrir le sélecteur
            if (this.dropzone) {
                this.dropzone.addEventListener('click', () => this.fileInput.click());
                this.dropzone.style.cursor = 'pointer';
            }

            // Bouton supprimer tout
            if (this.deleteAllBtn) {
                this.deleteAllBtn.addEventListener('click', () => this.deleteAll());
            }

            // Drag & Drop sur la zone
            this.setupDropzone();

            // Lecteur audio
            if (this.audioPlayer) {
                this.setupAudioPlayer();
            }
        }

        /**
         * Configure la zone de drag & drop
         */
        setupDropzone() {
            const list = this.listElement;
            let dragCounter = 0; // Compteur pour gérer les événements imbriqués

            // Empêcher le comportement par défaut
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                list.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            // Highlight lors du drag (utiliser un compteur car dragenter/leave se déclenchent sur les enfants)
            list.addEventListener('dragenter', () => {
                dragCounter++;
                list.classList.add('drag-over');
                this.dropzone.dataset.active = 'true';
            });

            list.addEventListener('dragleave', () => {
                dragCounter--;
                if (dragCounter === 0) {
                    list.classList.remove('drag-over');
                    this.dropzone.dataset.active = 'false';
                }
            });

            list.addEventListener('drop', (e) => {
                dragCounter = 0;
                list.classList.remove('drag-over');
                this.dropzone.dataset.active = 'false';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files);
                }
            });
        }

        /**
         * Configure le lecteur audio
         */
        setupAudioPlayer() {
            if (!this.audioPlayer) return;

            this.audioPlayer.addEventListener('timeupdate', () => {
                const current = this.audioPlayer.currentTime;
                const duration = this.audioPlayer.duration || 0;
                const percent = duration > 0 ? (current / duration) * 100 : 0;
                
                this.progressBar.style.width = `${percent}%`;
                this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
            });

            this.audioPlayer.addEventListener('ended', () => {
                this.playBtn.innerHTML = ICONS.play;
                this.currentPlayingId = null;
                this.updatePlayingState();
            });

            this.audioPlayer.addEventListener('play', () => {
                this.playBtn.innerHTML = ICONS.pause;
            });

            this.audioPlayer.addEventListener('pause', () => {
                this.playBtn.innerHTML = ICONS.play;
            });

            this.playBtn.addEventListener('click', () => {
                if (this.audioPlayer.paused) {
                    this.audioPlayer.play();
                } else {
                    this.audioPlayer.pause();
                }
            });

            // Clic sur la barre de progression
            this.container.querySelector('.audio-progress').addEventListener('click', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
            });
        }

        /**
         * Formate le temps en mm:ss
         */
        formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        /**
         * Gère la sélection de fichiers
         */
        async handleFileSelect(fileList) {
            const files = Array.from(fileList);
            const validFiles = files.filter(file => this.validateFile(file));

            if (validFiles.length === 0) return;

            for (const file of validFiles) {
                // Pour les images, ouvrir l'éditeur d'image
                if (this.type === 'images' && this.typeConfig.useImageEditor && typeof ImageEditor !== 'undefined') {
                    await this.processImageWithEditor(file);
                } else {
                    await this.uploadFile(file);
                }
            }

            // Reset l'input
            this.fileInput.value = '';
        }

        /**
         * Valide un fichier
         */
        validateFile(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (!this.typeConfig.extensions.includes(ext)) {
                this.showError(translations.error_type + `: ${ext}`);
                return false;
            }

            // TODO: Vérifier la taille via UploadConfig si disponible
            return true;
        }

        /**
         * Traite une image avec l'éditeur
         */
        processImageWithEditor(file) {
            return new Promise((resolve) => {
                ImageEditor.open({
                    image: file,
                    caller: this.id,
                    onSave: async (result) => {
                        // result contient { blob, tempPath, filename }
                        if (result.tempPath) {
                            // L'image a été sauvegardée temporairement
                            await this.addFileFromTemp(result.tempPath, result.filename);
                        }
                        resolve();
                    },
                    onCancel: () => {
                        resolve();
                    }
                });
            });
        }

        /**
         * Ajoute un fichier depuis le stockage temporaire
         */
        async addFileFromTemp(tempPath, filename) {
            if (this.entityId) {
                // Mode édition : déplacer vers le dossier final
                try {
                    const response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'add_from_temp',
                            entity_type: this.entityType,
                            entity_id: this.entityId,
                            media_type: this.type,
                            temp_path: tempPath,
                            filename: filename,
                            is_default: this.isDefault
                        }),
                        credentials: 'same-origin'
                    });

                    const result = await response.json();
                    if (result.success) {
                        this.addFileToList(result.data);
                    } else {
                        this.showError(result.message || translations.error_upload);
                    }
                } catch (error) {
                    console.error('Add from temp error:', error);
                    this.showError(translations.error_upload);
                }
            } else {
                // Mode création : garder en pending
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                this.pendingFiles.push({
                    tempId,
                    tempPath,
                    filename,
                    type: this.type
                });
                
                this.addFileToList({
                    tempId,
                    filename,
                    path: tempPath,
                    thumbnailPath: tempPath
                });
            }
        }

        /**
         * Upload un fichier directement
         */
        async uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('action', 'upload');
            formData.append('entity_type', this.entityType);
            formData.append('media_type', this.type);
            formData.append('is_default', this.isDefault ? '1' : '0');

            if (this.entityId) {
                formData.append('entity_id', this.entityId);
            }

            // Afficher un placeholder de chargement
            const tempId = `loading-${Date.now()}`;
            this.addLoadingPlaceholder(tempId, file.name);

            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                const result = await response.json();
                
                // Retirer le placeholder
                this.removeLoadingPlaceholder(tempId);

                if (result.success) {
                    if (this.entityId) {
                        this.addFileToList(result.data);
                    } else {
                        // Mode création : stocker le fichier temporaire
                        const pendingFile = {
                            tempId: result.data.tempId || tempId,
                            tempPath: result.data.tempPath,
                            filename: result.data.filename,
                            thumbnailPath: result.data.thumbnailPath,
                            type: this.type
                        };
                        this.pendingFiles.push(pendingFile);
                        this.addFileToList({
                            tempId: pendingFile.tempId,
                            filename: pendingFile.filename,
                            path: pendingFile.tempPath,
                            thumbnailPath: pendingFile.thumbnailPath
                        });
                    }
                } else {
                    this.showError(result.message || translations.error_upload);
                }
            } catch (error) {
                console.error('Upload error:', error);
                this.removeLoadingPlaceholder(tempId);
                this.showError(translations.error_upload);
            }
        }

        /**
         * Ajoute un placeholder de chargement
         */
        addLoadingPlaceholder(tempId, filename) {
            const item = document.createElement('div');
            item.className = 'media-item media-item-loading';
            item.dataset.tempId = tempId;
            item.innerHTML = `
                <div class="media-item-loading-spinner"></div>
                <span class="media-item-filename">${this.escapeHtml(filename)}</span>
            `;
            this.itemsContainer.appendChild(item);
            this.updateEmptyState();
        }

        /**
         * Retire un placeholder de chargement
         */
        removeLoadingPlaceholder(tempId) {
            const item = this.itemsContainer.querySelector(`[data-temp-id="${tempId}"]`);
            if (item) {
                item.remove();
            }
        }

        /**
         * Ajoute un fichier à la liste visuelle
         */
        addFileToList(fileData) {
            // Ajouter aux fichiers
            this.files.push({
                id: fileData.id || null,
                tempId: fileData.tempId || null,
                filename: fileData.filename,
                path: fileData.path,
                thumbnailPath: fileData.thumbnailPath || fileData.path,
                order: this.files.length
            });

            // Créer l'élément DOM
            const item = this.createFileItem(fileData);
            this.itemsContainer.appendChild(item);
            
            // Initialiser le lazy loading pour les thumbnails
            const lazyBgEl = item.querySelector('.lazy-bg');
            if (lazyBgEl) {
                observeLazyBg(lazyBgEl);
            }

            // Mettre à jour l'UI
            this.updateEmptyState();
            this.updateCount();
            this.triggerChange();
        }

        /**
         * Crée un élément DOM pour un fichier
         */
        createFileItem(fileData) {
            const item = document.createElement('div');
            item.className = 'media-item';
            item.dataset.id = fileData.id || '';
            item.dataset.tempId = fileData.tempId || '';
            item.draggable = !this.readonly;

            const ext = fileData.filename.split('.').pop().toLowerCase();
            const icon = CONFIG.extensionIcons[ext] || CONFIG.extensionIcons.default;

            let content = '';

            if (this.typeConfig.displayMode === 'thumbnail' && fileData.thumbnailPath) {
                // Utiliser data-bg pour lazy loading avec Intersection Observer
                content = `
                    <div class="media-item-thumb lazy-bg" data-bg="${fileData.thumbnailPath}">
                        ${this.type === 'videos' ? `<span class="video-badge">${ICONS.play}</span>` : ''}
                    </div>
                `;
            } else {
                content = `
                    <div class="media-item-icon">
                        <span class="file-icon">${icon}</span>
                    </div>
                `;
            }

            item.innerHTML = `
                ${!this.readonly ? `<div class="media-item-drag">${ICONS.drag}</div>` : ''}
                <div class="media-item-content" title="${this.escapeHtml(fileData.filename)}">
                    ${content}
                    <span class="media-item-name">${this.escapeHtml(this.truncateFilename(fileData.filename))}</span>
                </div>
                <div class="media-item-actions">
                    ${this.getItemActions(fileData)}
                </div>
                ${!this.readonly ? `
                    <button type="button" class="media-item-delete" title="Supprimer">
                        ${ICONS.delete}
                    </button>
                ` : ''}
            `;

            // Événements
            this.attachItemEvents(item, fileData);

            return item;
        }

        /**
         * Génère les boutons d'action selon le type
         */
        getItemActions(fileData) {
            const actions = [];

            if (this.type === 'audio') {
                actions.push(`<button type="button" class="media-action-btn action-play" title="${translations.play}">${ICONS.play}</button>`);
            }

            if (this.type === 'images') {
                actions.push(`<button type="button" class="media-action-btn action-view" title="${translations.view}">${ICONS.view}</button>`);
                if (!this.readonly) {
                    actions.push(`<button type="button" class="media-action-btn action-edit" title="${translations.edit}">${ICONS.edit}</button>`);
                }
            }

            if (this.type === 'videos') {
                actions.push(`<button type="button" class="media-action-btn action-view" title="${translations.view}">${ICONS.view}</button>`);
            }

            if (this.type === 'documents') {
                // Bouton voir (ouvre DocumentViewer)
                actions.push(`<button type="button" class="media-action-btn action-view" title="${translations.view}">${ICONS.view}</button>`);
                // Bouton télécharger
                actions.push(`<button type="button" class="media-action-btn action-download" title="${translations.download}">${ICONS.download}</button>`);
            }

            return actions.join('');
        }

        /**
         * Attache les événements à un élément de fichier
         */
        attachItemEvents(item, fileData) {
            // Bouton supprimer
            const deleteBtn = item.querySelector('.media-item-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFile(fileData.id || fileData.tempId);
                });
            }

            // Actions spécifiques
            const playBtn = item.querySelector('.action-play');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.playAudio(fileData);
                });
            }

            const viewBtn = item.querySelector('.action-view');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.type === 'documents') {
                        this.viewDocument(fileData);
                    } else {
                        this.viewFile(fileData);
                    }
                });
            }

            const editBtn = item.querySelector('.action-edit');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editImage(fileData);
                });
            }

            const downloadBtn = item.querySelector('.action-download');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.downloadFile(fileData);
                });
            }

            // Clic sur l'item
            item.querySelector('.media-item-content').addEventListener('click', () => {
                if (this.type === 'audio') {
                    this.playAudio(fileData);
                } else if (this.type === 'images' || this.type === 'videos') {
                    this.viewFile(fileData);
                } else if (this.type === 'documents') {
                    this.viewDocument(fileData);
                } else {
                    this.downloadFile(fileData);
                }
            });

            // Drag & Drop pour réorganisation
            if (!this.readonly) {
                this.attachDragEvents(item);
            }
        }

        /**
         * Attache les événements de drag pour réorganisation
         */
        attachDragEvents(item) {
            item.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.id || item.dataset.tempId);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedItem = null;
                this.saveOrder();
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!this.draggedItem || this.draggedItem === item) return;

                const rect = item.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                
                if (e.clientX < midX) {
                    item.parentNode.insertBefore(this.draggedItem, item);
                } else {
                    item.parentNode.insertBefore(this.draggedItem, item.nextSibling);
                }
            });
        }

        /**
         * Sauvegarde l'ordre des fichiers
         */
        async saveOrder() {
            const items = this.itemsContainer.querySelectorAll('.media-item:not(.media-item-loading)');
            const order = [];

            items.forEach((item, index) => {
                const id = item.dataset.id || item.dataset.tempId;
                order.push({ id, order: index });
                
                // Mettre à jour l'ordre local
                const file = this.files.find(f => (f.id && f.id.toString() === id) || f.tempId === id);
                if (file) {
                    file.order = index;
                }
            });

            // Si en mode édition avec entityId, sauvegarder côté serveur
            if (this.entityId && order.some(o => !o.id.startsWith('temp-'))) {
                try {
                    await fetch(this.apiEndpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'reorder',
                            entity_type: this.entityType,
                            entity_id: this.entityId,
                            media_type: this.type,
                            order: order.filter(o => !o.id.startsWith('temp-'))
                        }),
                        credentials: 'same-origin'
                    });
                } catch (error) {
                    console.error('Reorder error:', error);
                }
            }

            this.triggerChange();
        }

        /**
         * Supprime un fichier
         */
        async deleteFile(fileId) {
            // Confirmation
            if (typeof ModalManager !== 'undefined') {
                const confirmed = await ModalManager.confirm(translations.delete_confirm, {
                    type: 'danger',
                    confirmText: 'Supprimer'
                });
                if (!confirmed) return;
            } else if (!confirm(translations.delete_confirm)) {
                return;
            }

            // Si c'est un fichier temporaire
            if (typeof fileId === 'string' && fileId.startsWith('temp-')) {
                this.pendingFiles = this.pendingFiles.filter(f => f.tempId !== fileId);
                this.files = this.files.filter(f => f.tempId !== fileId);
                this.removeFileElement(fileId);
                return;
            }

            // Supprimer côté serveur
            if (this.entityId) {
                try {
                    const response = await fetch(`${this.apiEndpoint}?id=${fileId}&entity_type=${this.entityType}&media_type=${this.type}`, {
                        method: 'DELETE',
                        credentials: 'same-origin'
                    });

                    const result = await response.json();
                    if (!result.success) {
                        this.showError(result.message);
                        return;
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                    this.showError(translations.error_upload);
                    return;
                }
            }

            this.files = this.files.filter(f => f.id !== fileId && f.tempId !== fileId);
            this.removeFileElement(fileId);
        }

        /**
         * Supprime l'élément DOM d'un fichier
         */
        removeFileElement(fileId) {
            const item = this.itemsContainer.querySelector(`[data-id="${fileId}"], [data-temp-id="${fileId}"]`);
            if (item) {
                item.classList.add('removing');
                setTimeout(() => {
                    item.remove();
                    this.updateEmptyState();
                    this.updateCount();
                    this.triggerChange();
                }, 200);
            }
        }

        /**
         * Supprime tous les fichiers
         */
        async deleteAll() {
            if (this.files.length === 0) return;

            // Confirmation
            if (typeof ModalManager !== 'undefined') {
                const confirmed = await ModalManager.confirm(translations.delete_all_confirm, {
                    type: 'danger',
                    confirmText: translations.delete_all
                });
                if (!confirmed) return;
            } else if (!confirm(translations.delete_all_confirm)) {
                return;
            }

            // Supprimer côté serveur si en mode édition
            if (this.entityId) {
                try {
                    const response = await fetch(this.apiEndpoint, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'delete_all',
                            entity_type: this.entityType,
                            entity_id: this.entityId,
                            media_type: this.type
                        }),
                        credentials: 'same-origin'
                    });

                    const result = await response.json();
                    if (!result.success) {
                        this.showError(result.message);
                        return;
                    }
                } catch (error) {
                    console.error('Delete all error:', error);
                    this.showError(translations.error_upload);
                    return;
                }
            }

            // Vider les listes
            this.files = [];
            this.pendingFiles = [];
            this.itemsContainer.querySelectorAll('.media-item').forEach(item => item.remove());
            this.updateEmptyState();
            this.updateCount();
            this.triggerChange();

            // Arrêter le lecteur audio
            if (this.audioPlayer) {
                this.audioPlayer.pause();
                this.audioPlayer.src = '';
                this.playerContainer.style.display = 'none';
            }
        }

        /**
         * Lit un fichier audio
         */
        playAudio(fileData) {
            if (!this.audioPlayer) return;

            const isSameFile = this.currentPlayingId === (fileData.id || fileData.tempId);

            if (isSameFile && !this.audioPlayer.paused) {
                this.audioPlayer.pause();
            } else {
                if (!isSameFile) {
                    this.audioPlayer.src = fileData.path;
                    this.currentPlayingId = fileData.id || fileData.tempId;
                    this.filenameDisplay.textContent = fileData.filename;
                }
                this.audioPlayer.play();
                this.playerContainer.style.display = 'block';
            }

            this.updatePlayingState();
        }

        /**
         * Met à jour l'état visuel de lecture
         */
        updatePlayingState() {
            this.itemsContainer.querySelectorAll('.media-item').forEach(item => {
                const id = item.dataset.id || item.dataset.tempId;
                const isPlaying = id === this.currentPlayingId && !this.audioPlayer?.paused;
                item.classList.toggle('playing', isPlaying);
                
                const playBtn = item.querySelector('.action-play');
                if (playBtn) {
                    playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
                }
            });
        }

        /**
         * Affiche un fichier (image ou vidéo)
         */
        viewFile(fileData) {
            if (this.type === 'images') {
                // Ouvrir dans une lightbox ou modal
                if (typeof ModalManager !== 'undefined') {
                    ModalManager.open({
                        title: fileData.filename,
                        content: `<div class="media-viewer"><img src="${fileData.path}" alt="${this.escapeHtml(fileData.filename)}"></div>`,
                        size: 'modal-lg',
                        customClass: 'modal-media-viewer'
                    });
                } else {
                    window.open(fileData.path, '_blank');
                }
            } else if (this.type === 'videos') {
                if (typeof ModalManager !== 'undefined') {
                    ModalManager.open({
                        title: fileData.filename,
                        content: `<div class="media-viewer"><video src="${fileData.path}" controls autoplay></video></div>`,
                        size: 'modal-lg',
                        customClass: 'modal-media-viewer'
                    });
                } else {
                    window.open(fileData.path, '_blank');
                }
            }
        }

        /**
         * Édite une image
         */
        editImage(fileData) {
            if (typeof ImageEditor === 'undefined') {
                console.error('ImageEditor not available');
                return;
            }

            ImageEditor.open({
                image: fileData.path,
                caller: this.id,
                onSave: async (result) => {
                    // Mettre à jour le fichier avec la nouvelle version
                    if (result.tempPath) {
                        await this.updateFileFromTemp(fileData.id || fileData.tempId, result.tempPath, result.filename);
                    }
                }
            });
        }

        /**
         * Met à jour un fichier depuis le stockage temporaire
         */
        async updateFileFromTemp(fileId, tempPath, filename) {
            if (!this.entityId) {
                // Mode création : mettre à jour le pending
                const pendingIndex = this.pendingFiles.findIndex(f => f.tempId === fileId);
                if (pendingIndex !== -1) {
                    this.pendingFiles[pendingIndex].tempPath = tempPath;
                    this.pendingFiles[pendingIndex].filename = filename;
                }
                
                // Mettre à jour visuellement
                const file = this.files.find(f => f.tempId === fileId);
                if (file) {
                    file.path = tempPath;
                    file.thumbnailPath = tempPath;
                    file.filename = filename;
                    this.refreshFileElement(file);
                }
                return;
            }

            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_from_temp',
                        id: fileId,
                        entity_type: this.entityType,
                        entity_id: this.entityId,
                        media_type: this.type,
                        temp_path: tempPath,
                        filename: filename
                    }),
                    credentials: 'same-origin'
                });

                const result = await response.json();
                if (result.success) {
                    const file = this.files.find(f => f.id === fileId);
                    if (file) {
                        file.path = result.data.path;
                        file.thumbnailPath = result.data.thumbnailPath || result.data.path;
                        file.filename = result.data.filename;
                        this.refreshFileElement(file);
                    }
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('Update error:', error);
                this.showError(translations.error_upload);
            }
        }

        /**
         * Rafraîchit l'affichage d'un fichier
         */
        refreshFileElement(fileData) {
            const item = this.itemsContainer.querySelector(`[data-id="${fileData.id}"], [data-temp-id="${fileData.tempId}"]`);
            if (item) {
                const newItem = this.createFileItem(fileData);
                item.replaceWith(newItem);
            }
        }

        /**
         * Ouvre un document avec DocumentViewer
         */
        viewDocument(fileData) {
            if (typeof DocumentViewer !== 'undefined') {
                DocumentViewer.open(fileData.path, fileData.filename);
            } else {
                // Fallback : téléchargement
                this.downloadFile(fileData);
            }
        }

        /**
         * Télécharge un fichier
         */
        downloadFile(fileData) {
            const link = document.createElement('a');
            link.href = fileData.path;
            link.download = fileData.filename;
            link.click();
        }

        /**
         * Met à jour l'état vide
         */
        updateEmptyState() {
            const hasFiles = this.itemsContainer.querySelectorAll('.media-item:not(.media-item-loading)').length > 0;
            this.emptyElement.style.display = hasFiles ? 'none' : 'flex';
            if (this.deleteAllBtn) {
                this.deleteAllBtn.style.display = hasFiles ? 'inline-flex' : 'none';
            }
        }

        /**
         * Met à jour le compteur
         */
        updateCount() {
            const count = this.files.length;
            this.countElement.textContent = `(${count})`;
        }

        /**
         * Déclenche le callback de changement
         */
        triggerChange() {
            if (this.onFilesChange) {
                this.onFilesChange({
                    type: this.type,
                    files: this.files,
                    pendingFiles: this.pendingFiles
                });
            }
        }

        /**
         * Affiche une erreur
         */
        showError(message) {
            if (this.onError) {
                this.onError(message);
            } else if (typeof showToast === 'function') {
                showToast(message, 'error');
            } else {
                console.error(message);
            }
        }

        /**
         * Tronque un nom de fichier
         */
        truncateFilename(filename, maxLength = 20) {
            if (filename.length <= maxLength) return filename;
            const ext = filename.split('.').pop();
            const name = filename.substring(0, filename.length - ext.length - 1);
            const truncated = name.substring(0, maxLength - ext.length - 4) + '...';
            return truncated + '.' + ext;
        }

        /**
         * Échappe le HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Charge les fichiers existants depuis le serveur
         */
        async loadFiles() {
            if (!this.entityId) return;

            try {
                const params = new URLSearchParams({
                    entity_type: this.entityType,
                    entity_id: this.entityId,
                    media_type: this.type,
                    is_default: this.isDefault ? '1' : '0'
                });

                const response = await fetch(`${this.apiEndpoint}?${params}`, {
                    credentials: 'same-origin'
                });

                const result = await response.json();
                if (result.success && result.data) {
                    this.files = [];
                    result.data.forEach(file => this.addFileToList(file));
                }
            } catch (error) {
                console.error('Load files error:', error);
            }
        }

        /**
         * Retourne les fichiers en attente (pour la création)
         */
        getPendingFiles() {
            return this.pendingFiles;
        }

        /**
         * Retourne tous les fichiers
         */
        getFiles() {
            return this.files;
        }

        /**
         * Retourne le nombre de fichiers
         */
        getFileCount() {
            return this.files.length;
        }

        /**
         * Vide tous les fichiers (avec suppression serveur si en mode édition)
         * Utilisé pour remplacer les médias lors d'un import
         * @param {boolean} skipServerDelete - Si true, ne supprime pas côté serveur (pour création)
         */
        async clear(skipServerDelete = false) {
            // Si en mode édition et qu'on a des fichiers, supprimer côté serveur
            if (!skipServerDelete && this.entityId && this.files.length > 0) {
                try {
                    const response = await fetch(this.apiEndpoint, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'delete_all',
                            entity_type: this.entityType,
                            entity_id: this.entityId,
                            media_type: this.type
                        }),
                        credentials: 'same-origin'
                    });

                    const result = await response.json();
                    if (!result.success) {
                        console.error('[MediaListManager] Erreur suppression serveur:', result.message);
                        // On continue quand même pour vider l'UI
                    }
                } catch (error) {
                    console.error('[MediaListManager] Erreur suppression serveur:', error);
                    // On continue quand même pour vider l'UI
                }
            }
            
            // Supprimer les éléments visuels
            this.itemsContainer.querySelectorAll('.media-item').forEach(item => item.remove());
            
            // Vider les listes en mémoire
            this.files = [];
            this.pendingFiles = [];
            
            // Mettre à jour l'affichage
            this.updateEmptyState();
            this.updateCount();
            this.triggerChange();
            
            // Arrêter le lecteur audio si présent
            if (this.audioPlayer) {
                this.audioPlayer.pause();
                this.audioPlayer.src = '';
                if (this.playerContainer) {
                    this.playerContainer.style.display = 'none';
                }
            }
        }

        /**
         * Définit l'ID de l'entité (après création)
         */
        setEntityId(entityId) {
            this.entityId = entityId;
        }

        /**
         * Finalise les fichiers en attente (les déplace vers le dossier final)
         */
        async finalizePendingFiles() {
            if (!this.entityId || this.pendingFiles.length === 0) return;

            const results = [];
            for (const pending of this.pendingFiles) {
                try {
                    const response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'finalize_temp',
                            entity_type: this.entityType,
                            entity_id: this.entityId,
                            media_type: this.type,
                            temp_path: pending.tempPath,
                            filename: pending.filename,
                            is_default: this.isDefault
                        }),
                        credentials: 'same-origin'
                    });

                    const result = await response.json();
                    if (result.success) {
                        results.push(result.data);
                    }
                } catch (error) {
                    console.error('Finalize error:', error);
                }
            }

            this.pendingFiles = [];
            return results;
        }

        /**
         * Détruit l'instance
         */
        destroy() {
            // Arrêter le lecteur audio
            if (this.audioPlayer) {
                this.audioPlayer.pause();
                this.audioPlayer.src = '';
            }

            // Nettoyer le conteneur
            this.container.innerHTML = '';

            // Supprimer de la liste des instances
            instances.delete(this.id);
        }

        /**
         * Ajoute une image depuis un Blob (ex: depuis CameraCapture)
         * @param {Blob} blob - Le blob de l'image
         * @param {string} filename - Nom du fichier (optionnel)
         */
        async addFromBlob(blob, filename = null) {
            if (!blob) return;

            // Générer un nom de fichier si non fourni
            if (!filename) {
                const ext = blob.type.split('/')[1] || 'jpg';
                filename = `photo_${Date.now()}.${ext}`;
            }

            // Créer un File depuis le Blob
            const file = new File([blob], filename, { type: blob.type });

            // Utiliser la méthode d'upload existante
            await this.uploadFile(file);
        }

        /**
         * Ajoute un fichier depuis un token proxy (gros fichiers déjà sur le serveur)
         * Le fichier a été téléchargé par le proxy et est stocké temporairement
         * @param {string} token - Token du fichier temporaire
         * @param {string} filename - Nom du fichier
         * @param {string} mimeType - Type MIME
         * @param {number} size - Taille en bytes
         */
        async addFromProxyToken(token, filename, mimeType, size) {
            if (!token) return;

            // Afficher un placeholder de chargement
            const tempId = `proxy-${Date.now()}`;
            this.addLoadingPlaceholder(tempId, filename);

            try {
                // Appeler l'API pour déplacer le fichier du proxy temp vers le bon dossier
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'add_from_proxy',
                        proxy_token: token,
                        filename: filename,
                        mime_type: mimeType,
                        entity_type: this.entityType,
                        entity_id: this.entityId,
                        media_type: this.type
                    }),
                    credentials: 'same-origin'
                });

                const result = await response.json();
                
                // Retirer le placeholder
                this.removeLoadingPlaceholder(tempId);

                if (result.success) {
                    if (this.entityId) {
                        this.addFileToList(result.data);
                    } else {
                        // Mode création : stocker la référence temporaire
                        const pendingFile = {
                            tempId: result.data.tempId || tempId,
                            tempPath: result.data.tempPath,
                            filename: result.data.filename,
                            type: this.type
                        };
                        this.pendingFiles.push(pendingFile);
                        this.addFileToList({
                            tempId: pendingFile.tempId,
                            filename: pendingFile.filename,
                            path: pendingFile.tempPath
                        });
                    }
                    console.log('[MediaList] Fichier proxy ajouté:', filename, `(${Math.round(size / 1024 / 1024)} Mo)`);
                } else {
                    console.error('[MediaList] Erreur ajout fichier proxy:', result.message);
                    this.showError(result.message || translations.error_upload);
                }
            } catch (error) {
                console.error('[MediaList] Erreur ajout depuis proxy:', error);
                this.removeLoadingPlaceholder(tempId);
                this.showError(translations.error_upload);
            }
        }

        /**
         * Ajoute une image depuis un résultat ImageEditor (avec tempPath)
         * @param {Object} result - Résultat de ImageEditor { blob, tempPath, filename }
         */
        async addFromImageEditor(result) {
            if (!result) return;

            if (result.tempPath) {
                // Utiliser le chemin temporaire
                await this.addFileFromTemp(result.tempPath, result.filename || `image_${Date.now()}.webp`);
            } else if (result.blob) {
                // Fallback: utiliser le blob
                await this.addFromBlob(result.blob, result.filename);
            }
        }
    }

    // ========================================
    // API Publique
    // ========================================
    return {
        /**
         * Crée une nouvelle instance de liste de médias
         */
        create: (options) => new MediaList(options),

        /**
         * Récupère une instance par ID
         */
        getInstance: (id) => instances.get(id),

        /**
         * Détruit une instance
         */
        destroy: (id) => {
            const instance = instances.get(id);
            if (instance) {
                instance.destroy();
            }
        },

        /**
         * Détruit toutes les instances
         */
        destroyAll: () => {
            instances.forEach(instance => instance.destroy());
            instances.clear();
        },

        /**
         * Configuration
         */
        CONFIG
    };
})();

// Export global
window.MediaListManager = MediaListManager;
