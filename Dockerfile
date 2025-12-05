# syntax=docker/dockerfile:1.7

##
## 1. Install dependencies
##
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

##
## 2. Build application
##
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Permite sobreescribir la URL base durante el build.
ARG VITE_API_BASE_URL=https://api.veterinariacue.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}

RUN npm run build

##
## 3. Runtime with Nginx
##
FROM nginx:1.25-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/hostinger/VeterinaryCUE-Frontend"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

