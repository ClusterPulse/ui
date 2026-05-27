# Build stage
FROM node:22-alpine AS builder

ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG GIT_TREE_STATE=unknown
ARG BUILD_DATE=unknown

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

# Inject version info as env vars for Vite
ENV VITE_APP_VERSION=${VERSION}
ENV VITE_GIT_COMMIT=${GIT_COMMIT}
ENV VITE_GIT_TREE_STATE=${GIT_TREE_STATE}
ENV VITE_BUILD_DATE=${BUILD_DATE}

# Build the application
RUN npm run build

# Production stage - Red Hat UBI 9 nginx (OpenShift-ready: user 1001, port 8080)
FROM registry.access.redhat.com/ubi9/nginx-124:1

COPY --from=builder /app/build /opt/app-root/src

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
