# Base stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start command (overridden by docker-compose for dev)
CMD ["npm", "run", "dev", "--", "--host"]
