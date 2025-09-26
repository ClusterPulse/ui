# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY ./package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY ./src ./src
COPY ./public ./public
COPY ./index.html .
COPY ./tsconfig*.json .
COPY ./vite.config.ts .

# Build the application
RUN npm run build

# Production stage - nginx
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Create necessary directories and set permissions for OpenShift
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    mkdir -p /var/run && \
    # Set group ownership to root (0) and permissions
    chgrp -R 0 /usr/share/nginx/html /etc/nginx /var/cache/nginx /var/run /var/log/nginx /tmp && \
    chmod -R g=u /usr/share/nginx/html /etc/nginx /var/cache/nginx /var/run /var/log/nginx /tmp && \
    # Make directories writable
    chmod g+w /var/cache/nginx /var/run /var/log/nginx /tmp && \
    # Ensure nginx can write to all subdirectories
    find /var/cache/nginx -type d -exec chmod g+w {} \;

# Switch to non-root user
USER 1001

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
