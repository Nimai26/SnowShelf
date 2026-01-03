<?php
/**
 * Script de vérification des mappings d'images
 */

$pdo = new PDO('mysql:host=10.110.1.1;port=3307;dbname=snowshelf', 'snowshelf', 'Amiral_Ackbar@38');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Mappings pour le champ images
echo "=== Mapping images (item_field_mappings) ===" . PHP_EOL;
$stmt = $pdo->query("SELECT * FROM item_field_mappings WHERE item_field = 'images'");
foreach ($stmt as $row) {
    echo "ID: {$row['id']}, webapi_id: {$row['webapi_id']}, api_path: {$row['api_path']}, transform: {$row['transform_type']}" . PHP_EOL;
    echo "  config: {$row['transform_config']}" . PHP_EOL;
}

// Tous les webapis
echo PHP_EOL . "=== Webapis ===" . PHP_EOL;
$stmt = $pdo->query("SELECT id, inter_name FROM webapis ORDER BY id");
foreach ($stmt as $row) {
    echo "ID: {$row['id']} - {$row['inter_name']}" . PHP_EOL;
}
