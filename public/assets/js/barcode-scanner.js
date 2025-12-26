/**
 * BarcodeScanner - Détection live de codes-barres
 * 
 * Utilise l'API native BarcodeDetector (Chrome/Edge) avec fallback QuaggaJS.
 * Supporte EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code, etc.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const BarcodeScanner = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        // Mode debug (logs dans la console)
        debug: false,
        // Intervalle entre les scans (ms)
        scanInterval: 150,
        // Formats supportés par BarcodeDetector natif
        nativeFormats: [
            'ean_13', 'ean_8', 'upc_a', 'upc_e',
            'code_128', 'code_39', 'code_93',
            'codabar', 'itf', 'qr_code', 'data_matrix'
        ],
        // Formats QuaggaJS (fallback)
        quaggaFormats: [
            'ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader',
            'code_128_reader', 'code_39_reader', 'code_93_reader',
            'codabar_reader', 'i2of5_reader'
        ],
        // Nombre de détections identiques requises pour confirmer
        confirmationThreshold: 2,
        // Délai max entre détections pour confirmation (ms)
        confirmationTimeout: 1000,
    };

    // === ÉTAT ===
    let isScanning = false;
    let scanIntervalId = null;
    let videoElement = null;
    let canvasElement = null;
    let canvasContext = null;
    let onDetectCallback = null;
    let onErrorCallback = null;
    let useNativeAPI = false;
    let barcodeDetector = null;
    let quaggaLoaded = false;
    let lastDetections = [];
    let lastDetectionTime = 0;

    // === INITIALISATION ===

    /**
     * Vérifie si l'API native est supportée
     */
    function checkNativeSupport() {
        if ('BarcodeDetector' in window) {
            return BarcodeDetector.getSupportedFormats().then(formats => {
                useNativeAPI = formats.length > 0;
                if (useNativeAPI) {
                    // Filtrer les formats supportés
                    const supportedFormats = CONFIG.nativeFormats.filter(f => formats.includes(f));
                    barcodeDetector = new BarcodeDetector({ formats: supportedFormats });
                    if (CONFIG.debug) console.log('BarcodeScanner: API native disponible, formats:', supportedFormats);
                }
                return useNativeAPI;
            }).catch(() => {
                useNativeAPI = false;
                return false;
            });
        }
        return Promise.resolve(false);
    }

    /**
     * Charge QuaggaJS si nécessaire
     */
    function loadQuagga() {
        return new Promise((resolve, reject) => {
            if (quaggaLoaded || typeof Quagga !== 'undefined') {
                quaggaLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/assets/libs/quagga/quagga.min.js';
            script.onload = () => {
                quaggaLoaded = true;
                if (CONFIG.debug) console.log('BarcodeScanner: QuaggaJS chargé');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Impossible de charger QuaggaJS'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Initialise le scanner
     * @param {Object} options - Options de configuration
     * @param {HTMLVideoElement} options.video - Élément vidéo source
     * @param {Function} options.onDetect - Callback appelé lors d'une détection (code, format)
     * @param {Function} options.onError - Callback appelé en cas d'erreur
     */
    async function init(options = {}) {
        videoElement = options.video;
        onDetectCallback = options.onDetect || (() => {});
        onErrorCallback = options.onError || console.error;

        if (!videoElement) {
            throw new Error('BarcodeScanner: Élément vidéo requis');
        }

        // Créer le canvas pour l'analyse
        canvasElement = document.createElement('canvas');
        canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });

        // Vérifier le support natif
        const hasNative = await checkNativeSupport();
        
        // Charger QuaggaJS comme fallback si pas de support natif
        if (!hasNative) {
            try {
                await loadQuagga();
            } catch (error) {
                console.warn('BarcodeScanner: QuaggaJS non disponible, scan désactivé');
                throw error;
            }
        }

        // Réinitialiser l'état
        lastDetections = [];
        lastDetectionTime = 0;

        if (CONFIG.debug) console.log('BarcodeScanner: Initialisé avec', useNativeAPI ? 'API native' : 'QuaggaJS');
    }

    /**
     * Démarre le scan continu
     */
    function start() {
        if (isScanning) return;
        
        isScanning = true;
        lastDetections = [];
        
        // Démarrer la boucle de scan
        scanIntervalId = setInterval(scanFrame, CONFIG.scanInterval);
        if (CONFIG.debug) console.log('BarcodeScanner: Scan démarré');
    }

    /**
     * Arrête le scan
     */
    function stop() {
        isScanning = false;
        
        if (scanIntervalId) {
            clearInterval(scanIntervalId);
            scanIntervalId = null;
        }
        
        lastDetections = [];
        if (CONFIG.debug) console.log('BarcodeScanner: Scan arrêté');
    }

    /**
     * Scanne une frame de la vidéo
     */
    async function scanFrame() {
        if (!isScanning || !videoElement || videoElement.paused || videoElement.ended) {
            return;
        }

        try {
            // Redimensionner le canvas à la taille de la vidéo
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            
            if (width === 0 || height === 0) return;
            
            canvasElement.width = width;
            canvasElement.height = height;
            
            // Dessiner la frame actuelle
            canvasContext.drawImage(videoElement, 0, 0, width, height);

            let result = null;

            if (useNativeAPI && barcodeDetector) {
                result = await scanWithNativeAPI();
            } else if (quaggaLoaded && typeof Quagga !== 'undefined') {
                result = await scanWithQuagga();
            }

            if (result) {
                handleDetection(result);
            }
        } catch (error) {
            // Ignorer les erreurs silencieuses (pas de code trouvé)
            if (error.message !== 'No barcode found') {
                if (CONFIG.debug && error.message !== 'No barcode found') {
                    console.warn('BarcodeScanner: Erreur scan', error);
                }
            }
        }
    }

    /**
     * Scan avec l'API native BarcodeDetector
     */
    async function scanWithNativeAPI() {
        const barcodes = await barcodeDetector.detect(canvasElement);
        
        if (barcodes.length > 0) {
            const barcode = barcodes[0];
            return {
                code: barcode.rawValue,
                format: barcode.format,
                confidence: 1.0
            };
        }
        
        return null;
    }

    /**
     * Scan avec QuaggaJS - utilise ImageData directement pour éviter les logs répétitifs
     */
    function scanWithQuagga() {
        return new Promise((resolve) => {
            try {
                const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                
                // Utiliser decodeSingle avec inputStream.src = canvas (pas dataURL)
                Quagga.decodeSingle({
                    src: canvasElement,
                    numOfWorkers: 0,
                    inputStream: {
                        size: Math.min(800, canvasElement.width),
                        singleChannel: false
                    },
                    decoder: {
                        readers: CONFIG.quaggaFormats,
                        debug: {
                            drawBoundingBox: false,
                            showFrequency: false,
                            drawScanline: false,
                            showPattern: false
                        }
                    },
                    locate: true,
                    locator: {
                        halfSample: true,
                        patchSize: 'medium',
                        debug: {
                            showCanvas: false,
                            showPatches: false,
                            showFoundPatches: false,
                            showSkeleton: false,
                            showLabels: false,
                            showPatchLabels: false,
                            showRemainingPatchLabels: false
                        }
                    },
                    debug: false
                }, (result) => {
                    if (result && result.codeResult) {
                        resolve({
                            code: result.codeResult.code,
                            format: result.codeResult.format,
                            confidence: result.codeResult.decodedCodes?.reduce((sum, c) => sum + (c.error || 0), 0) || 0.8
                        });
                    } else {
                        resolve(null);
                    }
                });
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Gère une détection et vérifie la confirmation
     */
    function handleDetection(result) {
        const now = Date.now();
        
        // Nettoyer les anciennes détections
        if (now - lastDetectionTime > CONFIG.confirmationTimeout) {
            lastDetections = [];
        }
        
        lastDetectionTime = now;
        lastDetections.push(result.code);
        
        // Garder seulement les N dernières détections
        if (lastDetections.length > CONFIG.confirmationThreshold * 2) {
            lastDetections = lastDetections.slice(-CONFIG.confirmationThreshold * 2);
        }
        
        // Compter les occurrences du code actuel
        const count = lastDetections.filter(c => c === result.code).length;
        
        // Si le code a été détecté suffisamment de fois, confirmer
        if (count >= CONFIG.confirmationThreshold) {
            if (CONFIG.debug) console.log('BarcodeScanner: Code confirmé:', result.code, '(' + result.format + ')');
            
            // Arrêter le scan et notifier
            stop();
            
            if (typeof onDetectCallback === 'function') {
                onDetectCallback({
                    code: result.code,
                    format: formatCodeType(result.format),
                    rawFormat: result.format
                });
            }
        }
    }

    /**
     * Formate le type de code pour l'affichage
     */
    function formatCodeType(format) {
        const formatMap = {
            'ean_13': 'EAN-13',
            'ean_8': 'EAN-8',
            'upc_a': 'UPC-A',
            'upc_e': 'UPC-E',
            'code_128': 'Code 128',
            'code_39': 'Code 39',
            'code_93': 'Code 93',
            'codabar': 'Codabar',
            'itf': 'ITF',
            'i2of5': 'ITF',
            'qr_code': 'QR Code',
            'data_matrix': 'Data Matrix',
            'ean_reader': 'EAN-13',
            'ean_8_reader': 'EAN-8',
            'upc_reader': 'UPC-A',
            'upc_e_reader': 'UPC-E',
            'code_128_reader': 'Code 128',
            'code_39_reader': 'Code 39',
            'code_93_reader': 'Code 93',
            'codabar_reader': 'Codabar',
            'i2of5_reader': 'ITF',
        };
        
        return formatMap[format] || format;
    }

    /**
     * Scanne une image statique (blob ou URL)
     * @param {Blob|string} source - Image à scanner
     * @returns {Promise<Object|null>} Résultat du scan
     */
    async function scanImage(source) {
        return new Promise(async (resolve, reject) => {
            const img = new Image();
            
            img.onload = async () => {
                // Créer un canvas temporaire
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                tempCtx.drawImage(img, 0, 0);
                
                try {
                    let result = null;
                    
                    // Essayer avec l'API native d'abord
                    if (useNativeAPI && barcodeDetector) {
                        const barcodes = await barcodeDetector.detect(tempCanvas);
                        if (barcodes.length > 0) {
                            result = {
                                code: barcodes[0].rawValue,
                                format: formatCodeType(barcodes[0].format),
                                rawFormat: barcodes[0].format
                            };
                        }
                    }
                    
                    // Fallback QuaggaJS
                    if (!result && quaggaLoaded && typeof Quagga !== 'undefined') {
                        result = await new Promise((res) => {
                            Quagga.decodeSingle({
                                src: tempCanvas.toDataURL('image/jpeg', 0.9),
                                numOfWorkers: 0,
                                decoder: {
                                    readers: CONFIG.quaggaFormats
                                },
                                locate: true
                            }, (qResult) => {
                                if (qResult && qResult.codeResult) {
                                    res({
                                        code: qResult.codeResult.code,
                                        format: formatCodeType(qResult.codeResult.format),
                                        rawFormat: qResult.codeResult.format
                                    });
                                } else {
                                    res(null);
                                }
                            });
                        });
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Impossible de charger l\'image'));
            
            if (source instanceof Blob) {
                img.src = URL.createObjectURL(source);
            } else {
                img.src = source;
            }
        });
    }

    /**
     * Vérifie si le scanner est disponible
     */
    function isAvailable() {
        return useNativeAPI || quaggaLoaded;
    }

    /**
     * Nettoie les ressources
     */
    function destroy() {
        stop();
        videoElement = null;
        canvasElement = null;
        canvasContext = null;
        onDetectCallback = null;
        onErrorCallback = null;
        lastDetections = [];
    }

    // === API PUBLIQUE ===
    return {
        init,
        start,
        stop,
        scanImage,
        isAvailable,
        isScanning: () => isScanning,
        destroy
    };
})();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeScanner;
}
