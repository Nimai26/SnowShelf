<?php
/**
 * API Publique - Récupération des mappings de champs pour l'import
 * 
 * Cette API est accessible aux utilisateurs connectés (pas seulement admin)
 * Elle permet au frontend de récupérer les mappings configurés pour:
 * - item_field_mappings: champs fixes (nom, description, valeur, médias)
 * - primary_type_key_to_field: métadonnées dynamiques par type primaire
 * 
 * Endpoints:
 * - GET ?webapi_id=X : Récupère les mappings de champs fixes pour un provider
 * - GET ?primary_type_id=X : Récupère les mappings de métadonnées pour un type
 * - GET ?webapi_id=X&primary_type_id=Y : Récupère les deux types de mappings
 * 
 * @package SnowShelf API
 * @since 2025-01-21
 */

session_start();
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=utf-8');

// Vérifier l'authentification (utilisateur connecté)
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

// Seulement GET autorisé
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$pdo = getDbConnection();

$webapiId = isset($_GET['webapi_id']) ? (int)$_GET['webapi_id'] : null;
$primaryTypeId = isset($_GET['primary_type_id']) ? (int)$_GET['primary_type_id'] : null;

if (!$webapiId && !$primaryTypeId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'webapi_id or primary_type_id required']);
    exit;
}

try {
    $result = [
        'success' => true,
        'data' => []
    ];
    
    // Récupérer les mappings de champs fixes (item_field_mappings)
    // Note: Ces mappings sont génériques (pas par provider), donc on retourne tous les mappings
    if ($webapiId) {
        $stmt = $pdo->query("
            SELECT 
                id,
                item_field,
                api_path,
                transform_type,
                transform_config
            FROM item_field_mappings
            ORDER BY id
        ");
        $fieldMappings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Décoder les transform_config JSON
        foreach ($fieldMappings as &$mapping) {
            if ($mapping['transform_config']) {
                $mapping['transform_config'] = json_decode($mapping['transform_config'], true);
            }
        }
        
        $result['data']['field_mappings'] = $fieldMappings;
    }
    
    // Récupérer les mappings de métadonnées (primary_type_key_to_field)
    if ($primaryTypeId) {
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.field_id,
                m.api_keys,
                m.transform_type,
                m.transform_config,
                m.priority,
                m.is_active,
                f.field_key,
                f.field_type,
                f.lang as field_lang
            FROM primary_type_key_to_field m
            JOIN primary_type_fields f ON m.field_id = f.id
            WHERE f.primary_type_id = ?
              AND m.is_active = 1
            ORDER BY f.sort_order, m.priority DESC
        ");
        $stmt->execute([$primaryTypeId]);
        $metadataMappings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Décoder les JSON
        foreach ($metadataMappings as &$mapping) {
            $mapping['api_keys'] = $mapping['api_keys'] ? json_decode($mapping['api_keys'], true) : [];
            $mapping['transform_config'] = $mapping['transform_config'] ? json_decode($mapping['transform_config'], true) : null;
            $mapping['field_lang'] = $mapping['field_lang'] ? json_decode($mapping['field_lang'], true) : [];
            $mapping['is_active'] = (bool)$mapping['is_active'];
        }
        
        $result['data']['metadata_mappings'] = $metadataMappings;
    }
    
    echo json_encode($result);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
