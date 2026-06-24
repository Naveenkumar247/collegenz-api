# ... (Top part of your builder stage)

COPY package*.json ./

# 1. Update the builder stage installation command:
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# 2. Update line 15 to include the same legacy flag bypass:
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# ... (Rest of your runtime start commands)
