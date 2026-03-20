# 🚀 DÉPLOIEMENT & INFRASTRUCTURE - SnowShelf v2

> **Guide d'infrastructure et déploiement** - DevOps complet
> 
> **Date de création** : 20 février 2026
> **Status** : 🏗️ Spécifications complètes

---

## 🎯 Stratégie de Déploiement

### Environnements

```
┌─────────────────────────────────────────────────────────┐
│                 ENVIRONMENTS PIPELINE                    │
└─────────────────────────────────────────────────────────┘

Development (Local)
├─ Docker Compose
├─ Hot reload
├─ Debug tools
└─ Mock services

    ↓ git push

Staging (Cloud)
├─ Kubernetes cluster
├─ Auto-deploy on merge to develop
├─ QA testing
└─ Performance testing

    ↓ git tag

Production (Cloud)
├─ Kubernetes cluster (HA)
├─ Manual approval
├─ Blue/Green deployment
├─ Monitoring & alerting
└─ Auto-scaling
```

### Architecture des Services

**Stack SnowShelf** :
- **Backend** : NestJS API (port 3000)
- **Frontend** : React PWA (port 5173 dev, 80/443 prod)
- **MariaDB** : Base de données principale (port 3306)
- **Redis** : Cache & sessions (port 6379)
- **MailHog** : Tests emails en dev (port 8025)

**Stack Tako_Api** (instance dédiée) :
- **Tako_Api** : API de recherche unifiée (port 3001 dev, 3000 interne)
  - 32 providers répartis en 11 domaines
  - Cache PostgreSQL intégré
  - Traduction automatique
- **PostgreSQL** : Cache Tako_Api (port 5433 dev, 5432 interne)
- **FlareSolverr** : Bypass Cloudflare pour certains providers (port 8191)
  - Utilisé par : LEGO, Playmobil, Bedetheque
  - Limite : 3 sessions simultanées max (évite saturation mémoire)

**Volumes de données** :
- `mariadb_data` : ~50 GB (collections utilisateurs)
- `tako_postgres_data` : ~5 GB (cache API)
- `redis_data` : ~1 GB (cache applicatif)
- `storage_data` : ~100 GB (médias utilisateurs)

---

## 🐳 Docker Configuration

### Backend Dockerfile

```dockerfile
# /backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

# ─────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Frontend Dockerfile

```dockerfile
# /frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

# Build production
ENV NODE_ENV=production
RUN pnpm build

# ─────────────────────────────────────────────

FROM nginx:alpine AS runner

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Security headers
RUN echo 'add_header X-Frame-Options "SAMEORIGIN" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (développement)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ──────────────────────────────────────────────────
  # DATABASE
  # ──────────────────────────────────────────────────
  mariadb:
    image: mariadb:10.11
    container_name: snowshelf_mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: snowshelf_db
      MYSQL_USER: snowshelf
      MYSQL_PASSWORD: snowshelf_password
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3306:3306"
    networks:
      - snowshelf_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────────
  # REDIS
  # ──────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: snowshelf_redis
    restart: unless-stopped
    command: redis-server --requirepass redis_password --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - snowshelf_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────────
  # TAKO_API - API de recherche unifiée (32 providers)
  # ──────────────────────────────────────────────────
  tako_api:
    build:
      context: ../Tako_Api
      dockerfile: Dockerfile
    container_name: snowshelf_tako_api
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3000
      DB_ENABLED: "true"
      DB_HOST: tako_postgres
      DB_PORT: 5432
      DB_NAME: tako_cache
      DB_USER: tako
      DB_PASSWORD: tako_password
      FSR_URL: http://flaresolverr:8191/v1
      DEFAULT_LOCALE: fr-FR
      CACHE_TTL: 300000
      AUTO_TRAD_ENABLED: "true"
    volumes:
      - ../Tako_Api:/app
      - /app/node_modules
    ports:
      - "3001:3000"
    networks:
      - snowshelf_network
    depends_on:
      tako_postgres:
        condition: service_healthy
      flaresolverr:
        condition: service_started
    command: npm run dev

  # PostgreSQL pour Tako_Api (cache)
  tako_postgres:
    image: postgres:16-alpine
    container_name: snowshelf_tako_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: tako_cache
      POSTGRES_USER: tako
      POSTGRES_PASSWORD: tako_password
    volumes:
      - tako_postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    networks:
      - snowshelf_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tako"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FlareSolverr pour bypass Cloudflare (LEGO, Playmobil, etc.)
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: snowshelf_flaresolverr
    restart: unless-stopped
    environment:
      LOG_LEVEL: info
      LOG_HTML: "false"
      CAPTCHA_SOLVER: none
      TZ: Europe/Paris
      HEADLESS: "true"
      BROWSER_TIMEOUT: 40000
      MAX_TIMEOUT: 60000
      # IMPORTANT: Limite le nombre de sessions pour éviter saturation
      MAX_SESSIONS: 3
      SESSION_TTL: 300000  # 5 minutes
    ports:
      - "8191:8191"
    networks:
      - snowshelf_network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'

  # ──────────────────────────────────────────────────
  # BACKEND
  # ──────────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: snowshelf_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DB_HOST: mariadb
      DB_PORT: 3306
      DB_NAME: snowshelf_db
      DB_USER: snowshelf
      DB_PASSWORD: snowshelf_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis_password
      JWT_SECRET: dev_jwt_secret_change_in_prod
      JWT_REFRESH_SECRET: dev_refresh_secret_change_in_prod
      JWT_EXPIRATION: 15m
      JWT_REFRESH_EXPIRATION: 7d
      # Email (MailHog en dev, SMTP réel en prod)
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
      SMTP_USER: ""
      SMTP_PASSWORD: ""
      SMTP_FROM: "noreply@snowshelf.fr"
      SMTP_SECURE: "false"
      # Admin par défaut (créé au démarrage si inexistant)
      ADMIN_EMAIL: "admin@snowshelf.fr"
      ADMIN_USERNAME: "admin"
      ADMIN_PASSWORD: "Admin1234!"
      # Tako_Api configuration
      TAKO_API_URL: http://tako_api:3000
      TAKO_API_TIMEOUT: 30000
      FRONTEND_URL: http://localhost:5173
    volumes:
      - ./backend:/app
      - /app/node_modules
      - storage_data:/app/storage
    ports:
      - "3000:3000"
    networks:
      - snowshelf_network
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_healthy
      tako_api:
        condition: service_started
    command: npm run start:dev

  # ──────────────────────────────────────────────────
  # FRONTEND
  # ──────────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: snowshelf_frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    networks:
      - snowshelf_network
    depends_on:
      - backend
    command: npm run dev -- --host

  # ──────────────────────────────────────────────────
  # MAILHOG (Email testing)
  # ──────────────────────────────────────────────────
  mailhog:
    image: mailhog/mailhog:latest
    container_name: snowshelf_mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - snowshelf_network

volumes:
  mariadb_data:
  redis_data:
  tako_postgres_data:
  storage_data:

networks:
  snowshelf_network:
    driver: bridge
```

**Services Tako_Api** :
- **tako_api** : API unifiée (port 3001 → 3000 interne)
- **tako_postgres** : Cache PostgreSQL (port 5433 → 5432 interne)
- **flaresolverr** : Bypass Cloudflare pour certains providers (port 8191)

**URLs de développement** :
- SnowShelf Backend : http://localhost:3000
- SnowShelf Frontend : http://localhost:5173
- Tako_Api : http://localhost:3001
- Tako_Api Docs : http://localhost:3001/docs
- FlareSolverr : http://localhost:8191
- MailHog : http://localhost:8025

---

## ☸️ Kubernetes Configuration

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: snowshelf-prod
  labels:
    name: snowshelf-prod
    environment: production
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: snowshelf-config
  namespace: snowshelf-prod
data:
  NODE_ENV: "production"
  DB_HOST: "mariadb-service"
  DB_PORT: "3306"
  DB_NAME: "snowshelf_prod"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  API_URL: "https://api.snowshelf.fr"
  FRONTEND_URL: "https://snowshelf.fr"
  # Tako_Api configuration
  TAKO_API_URL: "http://tako-api-service:3000"
  TAKO_API_TIMEOUT: "30000"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: snowshelf-secrets
  namespace: snowshelf-prod
type: Opaque
stringData:
  DB_USER: "snowshelf_prod_user"
  DB_PASSWORD: "CHANGEME_prod_strong_password"
  REDIS_PASSWORD: "CHANGEME_redis_strong_password"
  JWT_SECRET: "CHANGEME_jwt_secret_min_32_chars"
  JWT_REFRESH_SECRET: "CHANGEME_refresh_secret_min_32_chars"
  # Email SMTP
  SMTP_HOST: "smtp.sendgrid.net"
  SMTP_PORT: "587"
  SMTP_USER: "apikey"
  SMTP_PASSWORD: "CHANGEME_sendgrid_api_key"
  SMTP_FROM: "noreply@snowshelf.fr"
  SMTP_SECURE: "false"
  # Admin par défaut (créé au démarrage si inexistant)
  ADMIN_EMAIL: "admin@snowshelf.fr"
  ADMIN_USERNAME: "admin"
  ADMIN_PASSWORD: "CHANGEME_admin_strong_password"
```

### MariaDB StatefulSet

```yaml
# k8s/mariadb-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mariadb
  namespace: snowshelf-prod
spec:
  serviceName: mariadb-service
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
      - name: mariadb
        image: mariadb:10.11
        ports:
        - containerPort: 3306
          name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: snowshelf-secrets
              key: DB_PASSWORD
        - name: MYSQL_DATABASE
          valueFrom:
            configMapKeyRef:
              name: snowshelf-config
              key: DB_NAME
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: snowshelf-secrets
              key: DB_USER
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: snowshelf-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: mariadb-storage
          mountPath: /var/lib/mysql
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: mariadb-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mariadb-service
  namespace: snowshelf-prod
spec:
  selector:
    app: mariadb
  ports:
  - port: 3306
    targetPort: 3306
  clusterIP: None
```

### Redis Deployment

```yaml
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: snowshelf-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        - --maxmemory
        - "2gb"
        - --maxmemory-policy
        - allkeys-lru
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: snowshelf-secrets
              key: REDIS_PASSWORD
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: snowshelf-prod
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### Tako_Api - Configuration

#### ConfigMap
```yaml
# k8s/tako-api-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tako-api-config
  namespace: snowshelf-prod
data:
  NODE_ENV: "production"
  PORT: "3000"
  DB_ENABLED: "true"
  DB_HOST: "tako-postgres-service"
  DB_PORT: "5432"
  DB_NAME: "tako_cache"
  DEFAULT_LOCALE: "fr-FR"
  CACHE_TTL: "300000"
  AUTO_TRAD_ENABLED: "true"
  FSR_URL: "http://flaresolverr-service:8191/v1"
```

#### Secrets
```yaml
# k8s/tako-api-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: tako-api-secrets
  namespace: snowshelf-prod
type: Opaque
stringData:
  DB_USER: "tako"
  DB_PASSWORD: "CHANGEME_tako_postgres_password"
  # Les clés API des providers externes sont gérées dans le .env de Tako_Api
  # et injectées directement comme variables d'environnement du conteneur.
  # SnowShelf n'a pas besoin de les connaître.
  BRICKSET_API_KEY: ""
  REBRICKABLE_API_KEY: ""
  GOOGLE_BOOKS_API_KEY: ""
  COMICVINE_API_KEY: ""
  TVDB_API_KEY: ""
  TMDB_API_KEY: ""
  DISCOG_API_KEY: ""
  RAWG_API_KEY: ""
  IGDB_CLIENT_ID: ""
  IGDB_CLIENT_SECRET: ""
  BGG_API_TOKEN: ""
  TCG_POKEMON_TOKEN: ""
```

#### PostgreSQL StatefulSet (Cache Tako_Api)
```yaml
# k8s/tako-postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: tako-postgres
  namespace: snowshelf-prod
spec:
  serviceName: tako-postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: tako-postgres
  template:
    metadata:
      labels:
        app: tako-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: tako-api-config
              key: DB_NAME
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: tako-api-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: tako-api-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: tako-postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - tako
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - tako
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: tako-postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: tako-postgres-service
  namespace: snowshelf-prod
spec:
  clusterIP: None
  selector:
    app: tako-postgres
  ports:
  - port: 5432
    targetPort: 5432
```

#### FlareSolverr Deployment
```yaml
# k8s/flaresolverr-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flaresolverr
  namespace: snowshelf-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flaresolverr
  template:
    metadata:
      labels:
        app: flaresolverr
    spec:
      containers:
      - name: flaresolverr
        image: ghcr.io/flaresolverr/flaresolverr:latest
        ports:
        - containerPort: 8191
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: LOG_HTML
          value: "false"
        - name: CAPTCHA_SOLVER
          value: "none"
        - name: TZ
          value: "Europe/Paris"
        - name: HEADLESS
          value: "true"
        - name: BROWSER_TIMEOUT
          value: "40000"
        - name: MAX_TIMEOUT
          value: "60000"
        - name: MAX_SESSIONS
          value: "3"
        - name: SESSION_TTL
          value: "300000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: flaresolverr-service
  namespace: snowshelf-prod
spec:
  selector:
    app: flaresolverr
  ports:
  - port: 8191
    targetPort: 8191
```

#### Tako_Api Deployment
```yaml
# k8s/tako-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tako-api
  namespace: snowshelf-prod
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: tako-api
  template:
    metadata:
      labels:
        app: tako-api
        version: v1.0.0
    spec:
      containers:
      - name: tako-api
        image: registry.snowshelf.fr/tako-api:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: tako-api-config
        - secretRef:
            name: tako-api-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: tako-api-service
  namespace: snowshelf-prod
spec:
  type: ClusterIP
  selector:
    app: tako-api
  ports:
  - port: 3000
    targetPort: 3000
```

### Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: snowshelf-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        version: v2.0.0
    spec:
      containers:
      - name: backend
        image: registry.snowshelf.fr/backend:v2.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: snowshelf-config
        - secretRef:
            name: snowshelf-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: storage
          mountPath: /app/storage
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: backend-storage-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: snowshelf-prod
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backend-storage-pvc
  namespace: snowshelf-prod
spec:
  accessModes:
  - ReadWriteMany
  storageClassName: "nfs-client"
  resources:
    requests:
      storage: 100Gi
```

### Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: snowshelf-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        version: v2.0.0
    spec:
      containers:
      - name: frontend
        image: registry.snowshelf.fr/frontend:v2.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: snowshelf-prod
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### Ingress (NGINX)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snowshelf-ingress
  namespace: snowshelf-prod
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - snowshelf.fr
    - www.snowshelf.fr
    - api.snowshelf.fr
    secretName: snowshelf-tls
  rules:
  # Frontend
  - host: snowshelf.fr
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: www.snowshelf.fr
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  # Backend API
  - host: api.snowshelf.fr
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3000
```

### HorizontalPodAutoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: snowshelf-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: snowshelf-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

env:
  REGISTRY: registry.snowshelf.fr
  BACKEND_IMAGE: backend
  FRONTEND_IMAGE: frontend

jobs:
  # ──────────────────────────────────────────────────
  # TESTS
  # ──────────────────────────────────────────────────
  test-backend:
    runs-on: ubuntu-latest
    services:
      mariadb:
        image: mariadb:10.11
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        working-directory: ./backend
        run: pnpm install --frozen-lockfile
      
      - name: Run linter
        working-directory: ./backend
        run: pnpm lint
      
      - name: Run unit tests
        working-directory: ./backend
        run: pnpm test:cov
        env:
          DB_HOST: localhost
          DB_PORT: 3306
          DB_NAME: test_db
          DB_USER: root
          DB_PASSWORD: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        working-directory: ./frontend
        run: pnpm install --frozen-lockfile
      
      - name: Run linter
        working-directory: ./frontend
        run: pnpm lint
      
      - name: Run tests
        working-directory: ./frontend
        run: pnpm test:coverage
      
      - name: Build
        working-directory: ./frontend
        run: pnpm build

  # ──────────────────────────────────────────────────
  # BUILD & PUSH DOCKER IMAGES
  # ──────────────────────────────────────────────────
  build-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:buildcache,mode=max

  build-frontend:
    needs: test-frontend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}

  # ──────────────────────────────────────────────────
  # DEPLOY TO STAGING
  # ──────────────────────────────────────────────────
  deploy-staging:
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.snowshelf.fr
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" > kubeconfig
          export KUBECONFIG=kubeconfig
      
      - name: Deploy to staging
        run: |
          kubectl set image deployment/backend backend=${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:develop -n snowshelf-staging
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:develop -n snowshelf-staging
          kubectl rollout status deployment/backend -n snowshelf-staging
          kubectl rollout status deployment/frontend -n snowshelf-staging

  # ──────────────────────────────────────────────────
  # DEPLOY TO PRODUCTION
  # ──────────────────────────────────────────────────
  deploy-production:
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://snowshelf.fr
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_PROD }}" > kubeconfig
          export KUBECONFIG=kubeconfig
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/backend backend=${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:main -n snowshelf-prod
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:main -n snowshelf-prod
          kubectl rollout status deployment/backend -n snowshelf-prod
          kubectl rollout status deployment/frontend -n snowshelf-prod
      
      - name: Run smoke tests
        run: |
          curl -f https://api.snowshelf.fr/health || exit 1
          curl -f https://snowshelf.fr || exit 1
```

---

## 📊 Monitoring & Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
      
      - job_name: 'snowshelf-backend'
        static_configs:
          - targets: ['backend-service.snowshelf-prod:3000']
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SnowShelf v2 - Production",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_sessions_total"
          }
        ]
      }
    ]
  }
}
```

---

## 🔐 Backup & Recovery

### Database Backup Script

```bash
#!/bin/bash
# scripts/backup-db.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mariadb"
DB_NAME="snowshelf_prod"
S3_BUCKET="s3://snowshelf-backups/db"

# Create backup
mysqldump -h mariadb-service \
  -u $DB_USER \
  -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql.gz $S3_BUCKET/

# Keep only last 30 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Keep only last 90 days on S3
aws s3 ls $S3_BUCKET/ | while read -r line; do
  createDate=$(echo $line | awk {'print $1" "$2'})
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "90 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk {'print $4'})
    aws s3 rm $S3_BUCKET/$fileName
  fi
done

echo "Backup completed: $DB_NAME-$TIMESTAMP.sql.gz"
```

### Kubernetes CronJob for Backups

```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: snowshelf-prod
spec:
  schedule: "0 2 * * *"  # Every day at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: registry.snowshelf.fr/backup:latest
            env:
            - name: DB_HOST
              value: mariadb-service
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: snowshelf-secrets
                  key: DB_USER
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: snowshelf-secrets
                  key: DB_PASSWORD
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

---

## ✅ Checklist de Déploiement

### Pre-Deployment
- [ ] Tests passants (unit + E2E)
- [ ] Code review approuvé
- [ ] Documentation à jour
- [ ] Variables d'environnement configurées
- [ ] Secrets créés dans Kubernetes
- [ ] Backup de la BDD effectué
- [ ] Plan de rollback préparé

### Deployment
- [ ] Images Docker buildées et pushées
- [ ] Déploiement staging réussi
- [ ] Tests smoke staging passants
- [ ] Approbation manuelle pour prod
- [ ] Déploiement production
- [ ] Vérification health checks
- [ ] Tests smoke production

### Post-Deployment
- [ ] Monitoring actif (Grafana)
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Performance validée (<2s load time)
- [ ] Rollback plan accessible
- [ ] Documentation mise à jour
- [ ] Équipe notifiée

---

**Cette infrastructure assure un déploiement robuste, scalable et monitoré pour SnowShelf v2.**
