FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY lib/ ./lib/
COPY tests/ ./tests/
COPY api/ ./api/
COPY policy/ ./policy/
COPY types/ ./types/
COPY start.js ./

# Create memory directory
RUN mkdir -p memory

# Expose port
EXPOSE 3001

# Start the engine
CMD ["node", "start.js"]
