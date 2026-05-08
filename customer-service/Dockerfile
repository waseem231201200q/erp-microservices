# =============================================
# Dockerfile - Customer Service
# ERP Microservices | Master 1 ISI 2026
# =============================================

# ── Étape 1 : Image de base ───────────────────
FROM node:20-alpine AS base

LABEL maintainer="Groupe ISI 2026 - Partie 1"
LABEL description="Customer Service - ERP Microservices"

# Répertoire de travail dans le conteneur
WORKDIR /app

# ── Étape 2 : Installation des dépendances ────
COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

# ── Étape 3 : Copie du code source ────────────
COPY . .

# ── Étape 4 : Sécurité - utilisateur non-root ─
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

USER nodeuser

# ── Exposition du port ────────────────────────
EXPOSE 3001

# ── Variables d'environnement par défaut ──────
ENV NODE_ENV=production
ENV PORT=3001

# ── Healthcheck ───────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# ── Démarrage ────────────────────────────────
CMD ["node", "src/server.js"]
