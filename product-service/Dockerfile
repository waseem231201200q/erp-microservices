# ============================================================
# Dockerfile - Product Service
# ERP Microservices - Master 1 ISI 2026
#
# Build multi-étapes :
#   Étape 1 (builder) : installation des dépendances
#   Étape 2 (runner)  : image de production légère
# ============================================================

# ── Étape 1 : Installation des dépendances ──────────────────
FROM node:20-alpine AS builder

LABEL maintainer="Groupe ISI Master 1 2026"
LABEL description="ERP - Product Service (Microservice)"

WORKDIR /app

# Copier uniquement package.json pour profiter du cache Docker
# Si package.json n'a pas changé, npm install est mis en cache
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm install --omit=dev

# ── Étape 2 : Image de production ───────────────────────────
FROM node:20-alpine AS runner

# Principe du moindre privilège : ne pas tourner en root
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001 -G nodejs

WORKDIR /app

# Copier uniquement le nécessaire depuis le builder
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs package.json ./

# Utiliser l'utilisateur non-root
USER nodeuser

# Port exposé par ce microservice
EXPOSE 3001

# Health check Docker natif
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=3001 \
    SERVICE_NAME=product-service \
    SERVICE_VERSION=1.0.0

# Démarrage du service
CMD ["node", "src/server.js"]
