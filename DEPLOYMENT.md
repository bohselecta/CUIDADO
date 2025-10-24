# 🚀 Deployment Guide

## 🎯 **Deployment Strategy**

With the monorepo structure, you have **two deployment options**:

### **Option 1: Separate Deployments (Recommended)**

**Pagi Hall Frontend → Vercel**
- Deploy `packages/pagihall/` as a static site
- Frontend calls external CUIDADO Engine APIs
- Clean separation of concerns

**CUIDADO Engine → Separate Service**
- Deploy `packages/engine/` as API service
- Options: Vercel, Railway, Render, DigitalOcean
- Provides AI endpoints for frontend

### **Option 2: Monolithic Deployment**

Deploy entire monorepo to Vercel (defeats separation purpose)

---

## 🏛️ **Pagi Hall Frontend Deployment (Vercel)**

### **Setup:**
1. **Connect to Vercel:**
   ```bash
   # In packages/pagihall/
   vercel --prod
   ```

2. **Environment Variables:**
   ```bash
   CUIDADO_ENGINE_URL=https://your-engine-api.com
   NEXT_PUBLIC_SITE_NAME=Pagi Hall
   ```

3. **Build Settings:**
   - **Framework:** Next.js
   - **Root Directory:** `packages/pagihall`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### **Result:**
- **Live Site:** `https://pagihall.vercel.app`
- **Static Frontend:** Civic visualization, UI/UX
- **External API Calls:** To CUIDADO Engine

---

## ⚙️ **CUIDADO Engine Deployment**

### **Option A: Vercel (API Routes)**
```bash
# In packages/engine/
vercel --prod
```

**Environment Variables:**
```bash
OLLAMA_HOST=https://your-ollama-instance.com
MODEL_PRIMARY=gemma3:4b-instruct-q4
EMBED_MODEL=nomic-embed-text
TEMP=0.7
TOP_P=0.9
POLICY_TOKEN_BUDGET=1800
EPISODIC_DB=./memory/episodic.sqlite
CIVIC_CURIOSITY_ENABLED=true
```

### **Option B: Railway/Render (Full Service)**
```bash
# Deploy packages/engine/ as Node.js service
# Better for persistent memory and Ollama integration
```

### **Result:**
- **API Endpoints:** `https://cuidado-engine.vercel.app/api/*`
- **AI Services:** Chat, memory, policy, civic functions
- **Cron Jobs:** Live topic updates every 10 minutes

---

## 🔗 **Integration**

### **Frontend → Engine Communication:**
```typescript
// In packages/pagihall/
const response = await fetch(`${process.env.CUIDADO_ENGINE_URL}/api/chat`, {
  method: 'POST',
  body: JSON.stringify({ message: userInput })
});
```

### **Environment Setup:**
```bash
# Frontend (.env.local)
CUIDADO_ENGINE_URL=https://cuidado-engine.vercel.app

# Engine (.env)
OLLAMA_HOST=https://your-ollama-instance.com
MODEL_PRIMARY=gemma3:4b-instruct-q4
```

---

## 🎯 **Recommended Production Setup**

### **1. Deploy Engine First:**
```bash
cd packages/engine
vercel --prod
# Note the API URL: https://cuidado-engine.vercel.app
```

### **2. Deploy Frontend:**
```bash
cd packages/pagihall
vercel --prod
# Set CUIDADO_ENGINE_URL=https://cuidado-engine.vercel.app
```

### **3. Test Integration:**
- Visit frontend: `https://pagihall.vercel.app`
- Test chat functionality
- Verify civic hall works
- Check live topic updates

---

## 📋 **Deployment Checklist**

### **Engine Deployment:**
- [ ] API routes working
- [ ] Environment variables set
- [ ] Cron jobs scheduled
- [ ] Ollama integration configured
- [ ] Memory persistence working

### **Frontend Deployment:**
- [ ] Static build successful
- [ ] Environment variables set
- [ ] Engine API URL configured
- [ ] All pages loading
- [ ] Civic hall visualization working

### **Integration Testing:**
- [ ] Chat functionality
- [ ] Civic hall live data
- [ ] Topic switching
- [ ] Error handling
- [ ] Performance

---

## 🚨 **Current Status**

**The current `vercel.json` is configured for Option 1 (separate deployments).**

**Next Steps:**
1. **Deploy Engine:** `cd packages/engine && vercel --prod`
2. **Deploy Frontend:** `cd packages/pagihall && vercel --prod`
3. **Configure Integration:** Set `CUIDADO_ENGINE_URL` in frontend
4. **Test:** Verify both services work together

---

**Result:** You'll have a **usable Pagi Hall site** and a **downloadable CUIDADO Engine repo** as separate, focused products! 🚀
