# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S freelance -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=freelance:nodejs /app/dist ./dist
COPY --from=builder --chown=freelance:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=freelance:nodejs /app/package*.json ./
COPY --from=builder --chown=freelance:nodejs /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown freelance:nodejs /app/uploads

# Install curl for health checks
RUN apk add --no-cache curl

# Switch to non-root user
USER freelance

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
