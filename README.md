# 🏛️ Pagi Hall + ⚙️ CUIDADO Engine v1.0
> **A quiet internet inside a villa — powered by careful, local intelligence.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?logo=next.js)
![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-blue?logo=ollama)
![Tauri](https://img.shields.io/badge/Desktop-Tauri-orange?logo=tauri)
![Local First](https://img.shields.io/badge/Architecture-Local--First-success)

---

## 🌿 Overview
**Pagi Hall** is a digital civic space — a Tuscan villa where visitors wear "cloaks" (their personal AI representatives) and join a living discussion shaped by world events.  
Each cloak runs on **CUIDADO**, a behavioral AI engine that learns through interaction, alignment, and care rather than surveillance or scale.

> Together they form a complete civic ecosystem for human-scale AI.

---

## 🧠 Architecture

| Layer | Description |
|--------|-------------|
| **Pagi Hall (Frontend)** | Tuscan-styled web interface visualizing civic discourse in real time. |
| **Civic API** | Handles representatives, intents, questions, and live topic feeds. |
| **CUIDADO Engine** | Behavioral AGI scaffold implementing reasoning, memory, planning & ethics. |
| **Ollama Runtime** | Local LLM inference (Gemma 3, Mistral 7B, etc.). |
| **SQLite Memory** | Stores lessons, episodes, and signals for each cloak. |
| **Tauri Installer** | Desktop launcher for private, offline operation. |

---

## ⚙️ Tech Stack
Next 14 • TypeScript • Tailwind • Ollama • SQLite • Tauri • Vercel (Cron Jobs)

---

## 🪞 Conceptual Model
### Pagi Hall = Society of Thought
- Visitors → Citizens  
- Cloaks → PAGIs (Personal AGIs)  
- Hall → Shared mental space  
- Topics → Civic focus (auto-rotating via news)  
- Movement → Intent alignment + curiosity  
- Connections → Dialogues + shared understanding  

### CUIDADO = Careful Machine
- Learns from outcomes and feedback  
- Transparent ethics (YAML constitutions)  
- Local processing, private data  
- Behavioral signals (U/N/S/V)

---

## 📂 Directory Layout
```
CUIDADO/
├── packages/
│   ├── engine/               # Core CUIDADO behavioral AI
│   │   ├── src/lib/          # AI modules (memory, controller, etc.)
│   │   ├── src/policy/       # YAML constitutions & modes
│   │   ├── tests/            # Unit tests
│   │   └── api/              # Engine API endpoints
│   └── pagihall/             # Civic visualization frontend
│       ├── app/              # Next.js pages
│       │   ├── page.tsx      # Villa landing
│       │   ├── cloak/page.tsx # Cloak initiation
│       │   ├── civic/hall/page.tsx # SVG Civic Hall
│       │   ├── briefs/page.tsx # Civic Briefs
│       │   └── cuidado/      # Engine public pages
│       ├── src/components/   # React components
│       └── public/          # Images & logos
├── docker-compose.yml        # Development environment
└── dev-setup.sh             # One-click setup
```

---

## 🧭 Getting Started
### Requirements
Node 20 • Docker Desktop • (optional Ollama CLI)

### Quick Start (Docker - Recommended)
```bash
git clone https://github.com/bohselecta/CUIDADO.git
cd CUIDADO
./dev-setup.sh
```

### Manual Setup
```bash
git clone https://github.com/bohselecta/CUIDADO.git
cd CUIDADO
npm install
docker-compose up
```

### Local Development (No Docker)
```bash
# Install dependencies
npm install

# Start engine
cd packages/engine && npm run dev

# Start frontend (in another terminal)
cd packages/pagihall && npm run dev
```

### Start Ollama (if not using Docker)
```bash
ollama serve &
ollama pull gemma3:4b-instruct-q4
```

Visit [`http://localhost:3000`](http://localhost:3000) for Pagi Hall  
Visit [`http://localhost:3001`](http://localhost:3001) for CUIDADO Engine API

---

## 🛠️ Development

### **Monorepo Structure**
This project uses a monorepo structure for focused development:

- **`packages/engine/`** - Core CUIDADO behavioral AI framework
- **`packages/pagihall/`** - Civic visualization frontend

### **Development Workflow**
```bash
# Focus on engine development
cd packages/engine
npm run dev

# Focus on frontend development  
cd packages/pagihall
npm run dev

# Full integration testing
docker-compose up
```

### **Key Benefits**
✅ **Clear Focus** - Engine vs Frontend development  
✅ **Independent Development** - Work on one without affecting the other  
✅ **Docker Integration** - Consistent development setup  
✅ **Easy Testing** - Isolated environments  

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for detailed development guide.

---

## 🧩 Therapeutic & Ethical Modes

Under `packages/engine/src/policy/therapy_modes.yaml`, CUIDADO includes:

* **Gottman** — relationship de-escalation
* **Frankl (Logotherapy)** — meaning & values
* **CBT** — thought → emotion → behavior
* **Existential** — authenticity & choice

Each mode modifies dialogue tone, turning AI into a behavioral mirror rather than a text generator.

---

## 🌍 Deployment

| Environment            | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| **Vercel (Pagi Hall)** | Public civic experience with RSS/Reddit topic rotation          |
| **Local (CUIDADO)**    | Full privacy, local Ollama runtime via Tauri installer          |
| **Bridge**             | Auto-detects localhost → connects to local model when available |

---

## 🛠️ Production To-Dos (For Later)

* [ ] Replace placeholder villa images
* [ ] Deploy to Vercel with cron config
* [ ] Monitor topic switching behavior
* [ ] Add analytics (Plausible/Fathom)
* [ ] Implement Civic Briefs generation

---

## 💬 Philosophy

> **Some build bigger models. We build smaller mirrors.**
> CUIDADO isn't an app — it's a pattern for careful intelligence:
> local, ethical, reflective, and aligned with human scale.

---

## 📘 License

MIT License © 2025 Pagi Hall Collective

---

## 🪄 Credits

* **Concept & Design:** Hayden
* **Engine Architecture:** CUIDADO Core
* **Visual Identity:** Pagi Hall Team
* **Inspiration:** Every quiet conversation that led to clarity.

---

## 🌄 The Vision Ahead

1. **Peer Halls** – networked civic nodes with encrypted thought bridges
2. **Collective Briefs** – cross-hall insight summaries
3. **Local Federations** – schools & communities hosting their own halls
4. **CUIDADO 2.0** – mood-aware, contextual learning

---

### 🔗 Visit   ▶ [**pagihall.com**](https://pagihall.com)

### ⚙️ Explore  ▶ [**/cuidado**](https://pagihall.com/cuidado)

> *Welcome to the beginning of Careful Intelligence.*