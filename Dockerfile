# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# CHANGED: Using npm install instead of npm ci
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# CHANGED: Using npm install with production flag instead of npm ci
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
