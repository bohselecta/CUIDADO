#!/bin/bash

echo "🏛️ CUIDADO Monorepo Development Setup"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Ollama is available
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Installing via Docker..."
    docker pull ollama/ollama:latest
fi

echo "📦 Installing dependencies..."
npm install

echo "🐳 Starting development environment..."
docker-compose up -d ollama

echo "⏳ Waiting for Ollama to start..."
sleep 10

echo "🤖 Pulling base model..."
docker exec -it cuidado-monorepo-ollama-1 ollama pull gemma3:4b-instruct-q4

echo "🚀 Starting all services..."
docker-compose up

echo "✅ Development environment ready!"
echo "   • Pagi Hall Frontend: http://localhost:3000"
echo "   • CUIDADO Engine API: http://localhost:3001"
echo "   • Ollama: http://localhost:11434"
