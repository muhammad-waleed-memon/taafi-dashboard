# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

# ─── Stage 1: Build React App ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package.json ./
COPY tsconfig.json ./

# Install npm dependencies
RUN npm install

# Copy source code files
COPY . .

# Compile TypeScript and build production bundles
RUN npm run build

# ─── Stage 2: Run Nginx Web Server ──────────────────────────
FROM nginx:alpine

# Copy built bundles from Stage 1 to Nginx root directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
