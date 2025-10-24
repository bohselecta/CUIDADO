#!/bin/bash

echo "🧪 Testing CUIDADO Monorepo Structure"
echo "====================================="

# Test 1: Check package structure
echo "📦 Testing package structure..."
if [ -d "packages/engine" ] && [ -d "packages/pagihall" ]; then
    echo "✅ Package directories exist"
else
    echo "❌ Package directories missing"
    exit 1
fi

# Test 2: Check engine files
echo "⚙️ Testing engine package..."
if [ -f "packages/engine/package.json" ] && [ -d "packages/engine/lib" ]; then
    echo "✅ Engine package structure correct"
else
    echo "❌ Engine package structure incorrect"
    exit 1
fi

# Test 3: Check frontend files
echo "🏛️ Testing frontend package..."
if [ -f "packages/pagihall/package.json" ] && [ -d "packages/pagihall/app" ]; then
    echo "✅ Frontend package structure correct"
else
    echo "❌ Frontend package structure incorrect"
    exit 1
fi

# Test 4: Check Docker setup
echo "🐳 Testing Docker setup..."
if [ -f "docker-compose.yml" ] && [ -f "packages/engine/Dockerfile" ] && [ -f "packages/pagihall/Dockerfile" ]; then
    echo "✅ Docker configuration complete"
else
    echo "❌ Docker configuration incomplete"
    exit 1
fi

# Test 5: Check development scripts
echo "🛠️ Testing development scripts..."
if [ -f "dev-setup.sh" ] && [ -f "DEVELOPMENT.md" ]; then
    echo "✅ Development scripts available"
else
    echo "❌ Development scripts missing"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Monorepo structure is ready."
echo ""
echo "Next steps:"
echo "1. Run: ./dev-setup.sh (for Docker development)"
echo "2. Or: cd packages/engine && npm run dev (for engine focus)"
echo "3. Or: cd packages/pagihall && npm run dev (for frontend focus)"
