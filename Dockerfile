# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (aproveita cache de camada)
COPY package*.json ./
RUN npm ci

# Copia o restante e builda
COPY . .

# VITE_API_URL é baked em tempo de build — passar via --build-arg
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Stage 2: serve ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Configuração customizada do nginx (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build estático gerado pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
