<?php
require __DIR__ . '/../config/database.php';
$pdo = getDbConnection();

// Récupérer les api_keys pour le champ isbn du type books (id=1)
$stmt = $pdo->prepare("SELECT ptf.id, ptf.field_key, ptf.label, ptkf.api_keys, ptkf.transform_type 
FROM primary_type_fields ptf 
LEFT JOIN primary_type_key_to_field ptkf ON ptf.id = ptkf.field_id 
WHERE ptf.primary_type_id = 1 AND ptf.field_key = 'isbn'");
$stmt->execute();
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Champ ISBN pour books:\n";
print_r($result);

// Voir tous les champs pour books avec leurs api_keys
$stmt = $pdo->prepare("SELECT ptf.field_key, ptf.label, ptkf.api_keys 
FROM primary_type_fields ptf 
LEFT JOIN primary_type_key_to_field ptkf ON ptf.id = ptkf.field_id 
WHERE ptf.primary_type_id = 1 
ORDER BY ptf.display_order");
$stmt->execute();
$all = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "\nTous les champs pour books:\n";
foreach($all as $row) {
    echo $row['field_key'] . ' => api_keys: ' . ($row['api_keys'] ?: 'NULL') . "\n";
}
