#!/bin/bash
# ============================================
# Script d'installation de FFmpeg statique
# Pour SnowShelf - Génération de thumbnails vidéo
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"

echo "=== Installation de FFmpeg statique ==="

# Vérifier si ffmpeg existe déjà
if [ -f "$SCRIPT_DIR/ffmpeg" ] && [ -x "$SCRIPT_DIR/ffmpeg" ]; then
    echo "✓ FFmpeg déjà installé"
    "$SCRIPT_DIR/ffmpeg" -version | head -1
    exit 0
fi

echo "Téléchargement des binaires FFmpeg statiques..."

# Télécharger
cd "$SCRIPT_DIR"
wget -q --show-progress "$FFMPEG_URL" -O ffmpeg-static.tar.xz

if [ $? -ne 0 ]; then
    echo "✗ Erreur lors du téléchargement"
    exit 1
fi

echo "Extraction..."

# Extraire
tar -xf ffmpeg-static.tar.xz

# Trouver le dossier extrait
EXTRACTED_DIR=$(ls -d ffmpeg-*-amd64-static 2>/dev/null | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    echo "✗ Erreur lors de l'extraction"
    exit 1
fi

# Déplacer les binaires
mv "$EXTRACTED_DIR/ffmpeg" .
mv "$EXTRACTED_DIR/ffprobe" .

# Nettoyer
rm -rf "$EXTRACTED_DIR" ffmpeg-static.tar.xz

# Vérifier l'installation
if [ -x "$SCRIPT_DIR/ffmpeg" ]; then
    echo "✓ FFmpeg installé avec succès"
    "$SCRIPT_DIR/ffmpeg" -version | head -1
else
    echo "✗ Erreur : FFmpeg non exécutable"
    exit 1
fi

echo ""
echo "Les binaires sont prêts à être utilisés par SnowShelf."
