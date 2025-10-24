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
pagihall/
├── app/
│   ├── page.tsx              # Villa landing
│   ├── cloak/page.tsx        # Cloak initiation
│   ├── civic/hall/page.tsx   # SVG Civic Hall
│   ├── briefs/page.tsx      # Civic Briefs
│   ├── cuidado/              # Engine public pages
│   │   ├── page.tsx          # Intro
│   │   ├── chat/page.tsx     # Assistant
│   │   ├── docs/page.tsx     # Quickstart
│   │   └── download/page.tsx # Installer info
│   └── api/…                 # Civic + Chat endpoints
├── src/lib/                  # Engine modules
├── src/policy/               # YAML constitutions & modes
└── public/                   # Images & logos
```

---

## 🧭 Getting Started
### Requirements
Node 20 • pnpm • Ollama installed • (optional Tauri CLI)

### Steps
```bash
git clone https://github.com/pagihall/cuidado
cd cuidado
pnpm install
cp .env.example .env
pnpm dev
```

### Start Ollama
```bash
ollama serve &
ollama pull gemma3:4b-instruct-q4
```

Visit [`http://localhost:3000`](http://localhost:3000)

---

## 🧩 Therapeutic & Ethical Modes

Under `/src/policy/modes.yaml`, CUIDADO includes:

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