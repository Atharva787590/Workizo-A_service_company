# syntax=docker/dockerfile:1
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with frozen lockfile
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . ./
RUN npm run build

# Production Serving Stage
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
