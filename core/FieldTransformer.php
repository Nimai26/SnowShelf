<?php
/**
 * FieldTransformer - Classe de transformation des valeurs de champs
 * 
 * Applique des transformations aux valeurs issues des API avant import
 * Les types de transformation sont définis dans la table field_transform_types
 * Les configurations spécifiques sont dans primary_type_key_to_field.transform_config
 * 
 * @package SnowShelf
 * @since 2025-12-18
 */

class FieldTransformer
{
    /**
     * Transforme une valeur selon le type et la configuration
     * 
     * @param mixed $value Valeur à transformer
     * @param string|null $type Type de transformation (clé de field_transform_types)
     * @param array|null $config Configuration de la transformation
     * @return mixed Valeur transformée
     */
    public static function transform($value, ?string $type, ?array $config = null)
    {
        // Pas de transformation ou valeur nulle
        if ($type === null || $type === 'none' || $value === null) {
            return $value;
        }
        
        return match($type) {
            'status_mapping' => self::transformStatusMapping($value, $config),
            'year_extract' => self::transformYearExtract($value),
            'array_join' => self::transformArrayJoin($value, $config),
            'first_value' => self::transformFirstValue($value),
            'boolean_fr' => self::transformBooleanFr($value),
            'pegi_normalize' => self::transformPegiNormalize($value),
            'duration_format' => self::transformDurationFormat($value, $config),
            'find_by_key' => self::transformFindByKey($value, $config),
            default => $value
        };
    }
    
    /**
     * Mapping de statut (anglais -> français)
     * Ex: "Ended" -> "Terminée"
     */
    private static function transformStatusMapping($value, ?array $config): string
    {
        if (!is_string($value) || empty($config)) {
            return $value;
        }
        
        $lowerValue = strtolower(trim($value));
        
        // Chercher dans les mappings (clés en minuscules)
        foreach ($config as $key => $translation) {
            if (strtolower($key) === $lowerValue) {
                return $translation;
            }
        }
        
        return $value;
    }
    
    /**
     * Extraction d'année depuis une date ou chaîne
     * Accepte: "2024", "2024-05-15", "May 15, 2024", etc.
     */
    private static function transformYearExtract($value): ?int
    {
        if (empty($value)) {
            return null;
        }
        
        // Si c'est déjà un nombre valide (année)
        if (is_numeric($value)) {
            $year = (int) $value;
            if ($year >= 1800 && $year <= 2100) {
                return $year;
            }
        }
        
        // Convertir en string
        $strValue = (string) $value;
        
        // Chercher un pattern d'année (4 chiffres)
        if (preg_match('/\b(19|20)\d{2}\b/', $strValue, $matches)) {
            return (int) $matches[0];
        }
        
        return null;
    }
    
    /**
     * Joindre un tableau en chaîne avec séparateur
     * Config: {"separator": ", "}
     */
    private static function transformArrayJoin($value, ?array $config): string
    {
        $separator = $config['separator'] ?? ', ';
        
        if (is_array($value)) {
            // Filtrer les valeurs vides et aplatir si nécessaire
            $flatValues = [];
            array_walk_recursive($value, function($v) use (&$flatValues) {
                if (!empty($v) && is_string($v)) {
                    $flatValues[] = trim($v);
                } elseif (is_array($v) && isset($v['name'])) {
                    // Cas des objets avec propriété 'name' (ex: directors de IMDB)
                    $flatValues[] = trim($v['name']);
                }
            });
            return implode($separator, array_unique($flatValues));
        }
        
        // Si c'est déjà une chaîne, vérifier si c'est du JSON
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return self::transformArrayJoin($decoded, $config);
            }
            return $value;
        }
        
        return (string) $value;
    }
    
    /**
     * Prendre la première valeur d'un tableau
     */
    private static function transformFirstValue($value)
    {
        if (is_array($value)) {
            if (empty($value)) {
                return null;
            }
            $first = reset($value);
            // Si c'est un objet avec 'name', extraire le name
            if (is_array($first) && isset($first['name'])) {
                return $first['name'];
            }
            return $first;
        }
        
        // Si c'est du JSON, décoder et reprendre
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return self::transformFirstValue($decoded);
            }
        }
        
        return $value;
    }
    
    /**
     * Convertir booléen en Oui/Non français
     */
    private static function transformBooleanFr($value): string
    {
        // Valeurs considérées comme "true"
        $trueValues = [true, 1, '1', 'true', 'yes', 'oui', 'on'];
        
        if (is_string($value)) {
            $value = strtolower(trim($value));
        }
        
        return in_array($value, $trueValues, false) ? 'Oui' : 'Non';
    }
    
    /**
     * Normaliser les classifications d'âge vers PEGI
     */
    private static function transformPegiNormalize($value): ?string
    {
        if (empty($value)) {
            return null;
        }
        
        $strValue = strtolower(trim((string) $value));
        
        // Si c'est déjà au format PEGI
        if (preg_match('/pegi\s*(\d+)/i', $strValue, $matches)) {
            return 'PEGI ' . $matches[1];
        }
        
        // Extraire un âge numérique
        if (preg_match('/(\d+)/', $strValue, $matches)) {
            $age = (int) $matches[1];
            if ($age <= 3) return 'PEGI 3';
            if ($age <= 7) return 'PEGI 7';
            if ($age <= 12) return 'PEGI 12';
            if ($age <= 16) return 'PEGI 16';
            return 'PEGI 18';
        }
        
        // Mappings ESRB -> PEGI
        $esrbToPegi = [
            'everyone' => 'PEGI 3',
            'e' => 'PEGI 3',
            'everyone 10+' => 'PEGI 12',
            'e10+' => 'PEGI 12',
            'e10' => 'PEGI 12',
            'teen' => 'PEGI 12',
            't' => 'PEGI 12',
            'mature' => 'PEGI 16',
            'm' => 'PEGI 16',
            'mature 17+' => 'PEGI 18',
            'adults only' => 'PEGI 18',
            'ao' => 'PEGI 18',
        ];
        
        return $esrbToPegi[$strValue] ?? null;
    }
    
    /**
     * Formater une durée
     * Config: {"unit": "minutes", "suffix": " min"}
     */
    private static function transformDurationFormat($value, ?array $config)
    {
        if (empty($value)) {
            return null;
        }
        
        $unit = $config['unit'] ?? 'minutes';
        $suffix = $config['suffix'] ?? '';
        
        // Extraire le nombre
        if (is_numeric($value)) {
            $duration = (int) $value;
        } else {
            // Essayer d'extraire un nombre
            if (preg_match('/(\d+)/', (string) $value, $matches)) {
                $duration = (int) $matches[1];
            } else {
                return $value;
            }
        }
        
        // Convertir si nécessaire
        if ($unit === 'hours' && $duration > 0) {
            $hours = floor($duration / 60);
            $minutes = $duration % 60;
            return $hours > 0 ? "{$hours}h" . ($minutes > 0 ? sprintf('%02d', $minutes) : '') : "{$minutes}min";
        }
        
        return $duration . $suffix;
    }
    
    /**
     * Trouver un élément dans un tableau selon une condition
     * Config: {"match_key": "country", "match_value": "FR", "return_key": "rating"}
     * 
     * Exemple d'entrée: [{"country": "FR", "rating": "TP"}, {"country": "US", "rating": "PG"}]
     * Avec config: {"match_key": "country", "match_value": "FR", "return_key": "rating"}
     * Résultat: "TP"
     */
    private static function transformFindByKey($value, ?array $config)
    {
        if (!is_array($value) || empty($config)) {
            return $value;
        }
        
        $matchKey = $config['match_key'] ?? null;
        $matchValue = $config['match_value'] ?? null;
        $returnKey = $config['return_key'] ?? null;
        
        if ($matchKey === null || $matchValue === null) {
            return $value;
        }
        
        // Chercher l'élément correspondant
        foreach ($value as $item) {
            if (is_array($item) && isset($item[$matchKey])) {
                if (strtolower((string)$item[$matchKey]) === strtolower((string)$matchValue)) {
                    // Élément trouvé
                    if ($returnKey !== null && isset($item[$returnKey])) {
                        return $item[$returnKey];
                    }
                    return $item;
                }
            }
        }
        
        return null;
    }

    /**
     * Récupère une valeur depuis un objet/tableau en utilisant une notation pointée
     * Ex: "metadata.stars" depuis ["metadata" => ["stars" => "valeur"]]
     * 
     * @param array $data Données source
     * @param string $path Chemin pointé (ex: "metadata.stars")
     * @return mixed|null Valeur trouvée ou null
     */
    public static function getValueByPath(array $data, string $path)
    {
        $keys = explode('.', $path);
        $value = $data;
        
        foreach ($keys as $key) {
            if (is_array($value) && array_key_exists($key, $value)) {
                $value = $value[$key];
            } else {
                return null;
            }
        }
        
        return $value;
    }
    
    /**
     * Trouve la première valeur non-nulle parmi une liste de chemins
     * 
     * @param array $data Données source
     * @param array $paths Liste de chemins à essayer
     * @return mixed|null Première valeur trouvée ou null
     */
    public static function findFirstValue(array $data, array $paths)
    {
        foreach ($paths as $path) {
            $value = self::getValueByPath($data, $path);
            if ($value !== null && $value !== '' && $value !== []) {
                return $value;
            }
        }
        return null;
    }
}
