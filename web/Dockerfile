# Multi-stage build for OmniMind Web (Google AI Studio + Our Foundation)

# Stage 1: Dependencies - Based on Google's setup
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder - Google's Vite build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production server - Our Express.js backend
FROM node:18-alpine AS production-backend
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY server.ts ./
RUN npm ci --only=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy built files
COPY --from=builder /app/dist ./dist

# Set permissions
RUN chown -R expressjs:nodejs /app

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/stats || exit 1

# Start the application
CMD ["node", "server.ts"]

# Stage 4: Development - Full setup for dev
FROM node:18-alpine AS development
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]