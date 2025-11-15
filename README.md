# Esmero

**Esmero** - From Portuguese, meaning perfection. A distilled writing canvas with an AI agent built from the foundation.

## What is Esmero?

Esmero is a fundamental reimagining of collaborative writing with AI. Not a feature-bloated tool, but a canvas that enables pure expression - where human creativity meets intelligent assistance.

- **Canvas**: Clean, focused writing environment powered by TipTap
- **Agent**: Context-aware AI assistant that responds and suggests edits
- **Projects**: Organized workspace for your documents
- **Diffs**: Accept or reject AI-suggested changes inline

## Tech Stack

**Frontend:**
- TypeScript, React 19, Vite
- TailwindCSS
- TipTap (rich text editor)

**Backend:**
- TypeScript, Node.js, Express
- OpenAI API (GPT-4.1, GPT-4o-mini)
- Zod (structured validation)

**Storage:**
- Browser LocalStorage (MVP)

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/esmero.git
cd esmero/app
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment:
```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. Run development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. Open http://localhost:5173

## Mission

Esmero empowers human expression. Like Michelangelo's "Creation of Adam" - bridging the gap between imagination and manifestation. The vision is infinite, but we start with the fundamentals: a canvas to write, an agent to assist.

## License

MIT
