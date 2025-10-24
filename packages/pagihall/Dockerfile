FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.mjs ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY app/ ./app/
COPY src/ ./src/
COPY public/ ./public/

# Expose port
EXPOSE 3000

# Start the frontend
CMD ["npm", "run", "dev"]
