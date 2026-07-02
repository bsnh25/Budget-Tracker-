# ==========================================
# Stage 1: Build Environment
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Build production assets
RUN npm run build

# ==========================================
# Stage 2: Production Web Server
# ==========================================
FROM nginx:1.25-alpine

# Copy built assets to Nginx static serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if exists, otherwise use standard default
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
