# Base stage
FROM node:18-alpine

WORKDIR /app/server

# Install system dependencies (build tools for native modules)
RUN apk add --no-cache openssl python3 make g++

# Copy server package files
COPY package.json ./

# Debug: Show what we're installing
RUN cat package.json

# Install dependencies with verbose logging
RUN npm install --legacy-peer-deps --loglevel verbose 2>&1 || (cat /root/.npm/_logs/*.log 2>/dev/null; exit 1)

# Copy server source code
COPY . .

# Generate Prisma Client (requires DATABASE_URL at build time)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
RUN apk add --no-cache dos2unix && dos2unix start.sh && chmod +x start.sh
CMD ["./start.sh"]
