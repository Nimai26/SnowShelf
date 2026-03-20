# ═══════════════════════════════════════════════════════════
# SnowShelf Backend - Production Dockerfile
# ═══════════════════════════════════════════════════════════
# Multi-stage build pour optimiser la taille de l'image
# ═══════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────
# Stage 1: Builder - Installation et compilation
# ────────────────────────────────────────────────────────────
FROM node:25-alpine AS builder

# Métadonnées
LABEL maintainer="SnowShelf Team"
LABEL description="SnowShelf Backend Production Build"

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm ci --include=dev --legacy-peer-deps

# Copier le code source
COPY src/ ./src/

# Compiler TypeScript en JavaScript
RUN npm run build

# Nettoyer les devDependencies (on n'en a plus besoin après le build)
RUN npm prune --production --legacy-peer-deps

# ────────────────────────────────────────────────────────────
# Stage 2: Runner - Image finale légère
# ────────────────────────────────────────────────────────────
FROM node:25-alpine AS runner

# Installer dumb-init pour gérer correctement les signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Passer à l'utilisateur non-root
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application avec dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
