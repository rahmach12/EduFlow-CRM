# ── Stage 1: Build the React/Vite application ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL is a build-time variable — Vite bakes it into the JS bundle.
# In Docker we use "/api" (relative) so Nginx can proxy it to the backend.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies first (layer-cached if package.json unchanged)
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY frontend/ ./

# Production build
RUN npm run build

# ── Stage 2: Serve the built assets with Nginx ────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Inject our custom Nginx config (handles SPA routing + /api proxy)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite production build
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure Nginx can read the files
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
