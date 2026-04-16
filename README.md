# Stories

A Context Engineering Agent Demo - A visual interface for managing AI agent conversation contexts with intelligent context window management.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (dark theme)
- **Backend**: Express.js + TypeScript + AI SDK
- **AI Provider**: OpenAI (GPT-4o)

## Features

- **Visual Context Management**: Track and visualize agent conversation nodes in real-time
- **Story Branching**: Create and switch between different conversation branches
- **Context Window**: Automatic context eviction with token-aware windowing
- **Meta-Agent Compression**: AI-powered context compression with heuristic thresholding to prevent context overflow
- **Fork & Merge**: Branch from any historical point in the conversation

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API Key

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### Configuration

Create a `.env` file in the `server/` directory with your OpenAI credentials:

```bash
cd server
cp .env.example .env
# Edit .env with your actual API key
```

Required environment variables:
- `STORIES_API_BASE_URL` - LLM API base URL (e.g., `https://api.openai.com/v1`)
- `STORIES_API_KEY` - Your API key

The backend will try to discover the model's maximum context size from the provider API. If the provider does not expose it, the server falls back to a 128K-token window and derives compression/fork budgets heuristically from that value.

The server will refuse to start if these variables are not set.

### Running

```bash
# Terminal 1: Start backend (port 3001)
cd server && npm run dev

# Terminal 2: Start frontend (port 3000)
npm start
```

Access the app at [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/state` | Get current context state |
| POST | `/api/chat` | Send message to agent |
| POST | `/api/action` | Perform actions (fork, collapse, recycle, etc.) |

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [AI SDK](https://sdk.vercel.ai/)
- [tsx](https://github.com/privatenumber/tsx)
