FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/

# Create memory directory
RUN mkdir -p memory

# Expose port
EXPOSE 3001

# Start the engine
CMD ["npm", "run", "dev"]
