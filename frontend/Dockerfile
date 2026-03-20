# ═══════════════════════════════════════════════════════════
# SnowShelf Frontend - Production Dockerfile
# ═══════════════════════════════════════════════════════════
# Multi-stage build pour optimiser la taille de l'image
# ═══════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────
# Stage 1: Builder - Installation et compilation
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Métadonnées
LABEL maintainer="SnowShelf Team"
LABEL description="SnowShelf Frontend Production Build"

# Variables d'environnement pour le build
ENV NPM_CONFIG_LOGLEVEL=warn

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm ci --include=dev --legacy-peer-deps

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/

# Build argument pour l'URL de l'API
ARG VITE_API_URL=https://snowshelf.fr
ENV VITE_API_URL=${VITE_API_URL}

# Compiler l'application (génère /app/dist)
RUN npm run build

# ────────────────────────────────────────────────────────────
# Stage 2: Runner - NGINX pour servir les fichiers statiques
# ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Métadonnées
LABEL maintainer="SnowShelf Team"
LABEL description="SnowShelf Frontend Production"

# Copier la configuration NGINX personnalisée
COPY --chown=nginx:nginx <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; media-src 'self' blob:; object-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;

    # Cache statique agressif
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - pas de cache
    location /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # React Router - toutes les routes vers index.html
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Démarrer NGINX
CMD ["nginx", "-g", "daemon off;"]
