# Multi-stage Dockerfile for Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps
COPY package*.json ./
RUN npm ci

# Copy project files and build
COPY . ./
RUN npm run prisma:generate || true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and prod deps
COPY --from=builder /app .
RUN npm prune --production || true

EXPOSE 3000
CMD ["npm", "run", "start"]
