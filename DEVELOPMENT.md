# 🏛️ CUIDADO Monorepo Development Guide

> **Focused development environment for CUIDADO Engine + Pagi Hall**

## 🎯 **Project Structure**

```
CUIDADO/
├── packages/
│   ├── engine/          # Core CUIDADO behavioral AI
│   │   ├── src/lib/     # AI modules (memory, controller, etc.)
│   │   ├── src/policy/  # YAML constitutions
│   │   ├── tests/       # Unit tests
│   │   └── api/         # Engine API endpoints
│   └── pagihall/        # Civic visualization frontend
│       ├── app/         # Next.js pages
│       ├── src/components/ # React components
│       └── public/      # Static assets
├── docker-compose.yml   # Development environment
└── dev-setup.sh        # One-click setup
```

## 🚀 **Quick Start**

### **Option 1: Docker Development (Recommended)**
```bash
# One-click setup
./dev-setup.sh

# Or manual setup
docker-compose up
```

### **Option 2: Local Development**
```bash
# Install dependencies
npm install

# Start engine
npm run dev:engine

# Start frontend (in another terminal)
npm run dev:frontend
```

## 🎯 **Development Focus**

### **For CUIDADO Engine Development:**
```bash
cd packages/engine
npm run dev
# Work on: AI modules, policy, memory systems, API endpoints
```

**Key Files:**
- `src/lib/controller.ts` - Main AI controller
- `src/lib/memory.ts` - SQLite memory system
- `src/policy/` - YAML constitutions
- `api/` - REST endpoints

### **For Pagi Hall Development:**
```bash
cd packages/pagihall
npm run dev
# Work on: Civic visualization, UI/UX, components
```

**Key Files:**
- `app/page.tsx` - Landing page
- `app/civic/hall/page.tsx` - Civic Hall visualization
- `src/components/CivicHall.tsx` - SVG visualization
- `src/components/ChatUI.tsx` - Chat interface

## 🐳 **Docker Services**

| Service | Port | Description |
|---------|------|-------------|
| **ollama** | 11434 | Local LLM inference |
| **cuidado-engine** | 3001 | Behavioral AI API |
| **pagihall-frontend** | 3000 | Civic visualization UI |

## 🛠️ **Development Commands**

```bash
# Start all services
npm run dev

# Start specific service
npm run dev:engine
npm run dev:frontend

# Run tests
npm run test

# Build all packages
npm run build

# Clean Docker environment
npm run clean
```

## 🔧 **Environment Variables**

### **Engine (.env in packages/engine/)**
```bash
OLLAMA_HOST=http://ollama:11434
MODEL_PRIMARY=gemma3:4b-instruct-q4
EMBED_MODEL=nomic-embed-text
TEMP=0.7
TOP_P=0.9
POLICY_TOKEN_BUDGET=1800
EPISODIC_DB=./memory/episodic.sqlite
CIVIC_CURIOSITY_ENABLED=true
```

### **Frontend (.env in packages/pagihall/)**
```bash
CUIDADO_ENGINE_URL=http://cuidado-engine:3001
NEXT_PUBLIC_SITE_NAME=Pagi Hall
```

## 🎯 **Development Workflow**

### **1. Engine-First Development**
- Focus on AI behavior, memory, policy
- Test via API endpoints
- No frontend dependencies

### **2. Frontend-First Development**
- Focus on visualization, UX
- Mock engine responses
- No AI dependencies

### **3. Integration Testing**
- Full Docker environment
- End-to-end testing
- Real AI + UI interaction

## 🚨 **Troubleshooting**

### **Docker Issues**
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -f
./dev-setup.sh
```

### **Port Conflicts**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :11434
```

### **Model Issues**
```bash
# Re-pull model
docker exec -it cuidado-monorepo-ollama-1 ollama pull gemma3:4b-instruct-q4
```

## 🎯 **Benefits of This Structure**

✅ **Clear Focus** - Engine vs Frontend development  
✅ **Independent Development** - Work on one without affecting the other  
✅ **Easy Testing** - Isolated environments  
✅ **Docker Integration** - Consistent development setup  
✅ **Scalable** - Easy to add more packages later  

## 🔗 **Next Steps**

1. **Choose your focus** - Engine or Frontend
2. **Start development** - Use appropriate commands
3. **Test integration** - Full Docker environment
4. **Deploy** - Separate deployment strategies

---

**Welcome to focused development!** 🚀
