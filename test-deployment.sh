#!/bin/bash

echo "🚀 Testing Deployment Configuration"
echo "=================================="

# Test 1: Check Vercel config
echo "📋 Testing Vercel configuration..."
if [ -f "vercel.json" ]; then
    echo "✅ Root vercel.json exists"
    if grep -q "packages/pagihall" vercel.json; then
        echo "✅ Points to pagihall package"
    else
        echo "❌ Does not point to pagihall package"
    fi
else
    echo "❌ vercel.json missing"
fi

# Test 2: Check frontend API routes
echo "🏛️ Testing frontend API routes..."
if [ -f "packages/pagihall/app/api/topics/live/route.ts" ]; then
    echo "✅ Live topics API in frontend"
else
    echo "❌ Live topics API missing from frontend"
fi

# Test 3: Check engine API routes
echo "⚙️ Testing engine API routes..."
if [ -d "packages/engine/api" ]; then
    echo "✅ Engine API routes exist"
    if [ -f "packages/engine/api/chat/route.ts" ]; then
        echo "✅ Chat API in engine"
    else
        echo "❌ Chat API missing from engine"
    fi
else
    echo "❌ Engine API routes missing"
fi

# Test 4: Check package configurations
echo "📦 Testing package configurations..."
if [ -f "packages/pagihall/package.json" ] && [ -f "packages/engine/package.json" ]; then
    echo "✅ Both package.json files exist"
else
    echo "❌ Package.json files missing"
fi

# Test 5: Check Next.js config
echo "⚡ Testing Next.js configuration..."
if [ -f "packages/pagihall/next.config.mjs" ] && [ -f "packages/pagihall/tailwind.config.ts" ]; then
    echo "✅ Next.js config files in frontend"
else
    echo "❌ Next.js config files missing"
fi

echo ""
echo "🎯 Deployment Strategy:"
echo "1. Frontend (Pagi Hall) → Vercel: packages/pagihall/"
echo "2. Engine (CUIDADO) → Separate service: packages/engine/"
echo "3. Integration via environment variables"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy engine: cd packages/engine && vercel --prod"
echo "2. Deploy frontend: cd packages/pagihall && vercel --prod"
echo "3. Set CUIDADO_ENGINE_URL in frontend environment"
