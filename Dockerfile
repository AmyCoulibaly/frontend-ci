# ───────── Étape 1 : dépendances (mise en cache tant que package*.json ne change pas) ─────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ───────── Étape 2 : tests unitaires (utilisée par Jenkins : docker build --target test) ─────────
FROM deps AS test
COPY . .
RUN npm test

# ───────── Étape 3 : build de production ─────────
FROM deps AS build
COPY . .
ARG VITE_API_URL=/api
# Production : le backend simulé et ses comptes fictifs ne sont PAS inclus dans le site compilé
ARG VITE_ENABLE_DEMO=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_DEMO=$VITE_ENABLE_DEMO
RUN npm run build

# ───────── Étape 4 : image finale (nginx sert les fichiers statiques et relaie /api) ─────────
FROM nginx:stable-alpine AS runtime
# Applique les correctifs de sécurité disponibles sur les paquets Alpine (réduit les alertes Trivy)
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
