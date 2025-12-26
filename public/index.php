<?php
/**
 * SnowShelf - Point d'entrée principal
 * Redirige vers la page de connexion si non authentifié
 */

session_start();

// Si l'utilisateur n'est pas connecté, rediriger vers login
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Sinon, rediriger vers le dashboard
header('Location: dashboard.php');
exit;
