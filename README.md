# SevaAI — Civic Complaint Platform

> Connecting citizens and governance. An intelligent civic representative.

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Citizen | priya@demo.com | demo123 |
| Officer | rajan@demo.com | demo123 |

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/sevaai.git
cd sevaai
```

### 2. Set up the backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn main:app --reload
```

### 3. Set up the frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your Supabase URL in .env.local
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

## Environment Variables

### Backend (.env)
```
ANTHROPIC_API_KEY=your_claude_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Frontend (.env.local)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

## Features
| Feature | Status |
|---------|--------|
| Voice complaint input (Hindi/English) | Working |
| AI classification (Claude) | Working |
| Ticket generation | Working |
| Chat thread per complaint | Working |
| Officer dashboard | Working |
| Real-time status updates | Working |
| SLA countdown | Working |
| Auto-escalation | Mocked (n8n workflow) |
| Community validation | Mocked |
| Intelligence dashboard | Mock data |

## Architecture
See `/docs/architecture.png`

## Tech Stack
- **AI**: Claude API (Anthropic) via LangChain
- **Frontend**: React + Tailwind CSS + Vite
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Voice**: Web Speech API
- **Deployment**: Vercel + Railway
