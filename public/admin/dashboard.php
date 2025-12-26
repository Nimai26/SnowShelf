<?php
/**
 * Redirection vers index.php pour compatibilité
 * L'admin est une SPA basée sur index.php avec des sections
 */
header('Location: index.php' . (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : ''));
exit;
