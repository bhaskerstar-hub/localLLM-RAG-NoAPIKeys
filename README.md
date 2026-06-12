# Enterprise RAG Platform

A multi-format Retrieval-Augmented Generation (RAG) platform built with
**LangChain**, **FastAPI**, **Chroma**, **Next.js**, and **Langfuse** for
observability. Ingest documents from multiple formats, ask questions in a
chat UI, get answers with inline source citations, and track usage and
answer-quality metrics.

## Features

- **Multi-format ingestion** - PDF, Excel (multi-sheet), CSV, and webpages
  (URL), each chunked with a strategy suited to the source type
- **Cited Q&A** - an LCEL RAG chain answers strictly from retrieved context
  and returns numbered `[n]` citations with source/page/sheet/snippet
- **Multi-provider LLMs** - swap between Anthropic, OpenAI, or a local Ollama
  model via one config flag; embeddings are provider-independent
  (HuggingFace local model by default, no API key required)
- **Observability** - optional self-hosted Langfuse stack traces every chat
  request (tokens, cost, latency, user/session) and records thumbs-up/down
  feedback as a "% positive results" quality signal
- **Usage analytics** - `/analytics` dashboard summarizing documents, chat
  volume, and feedback ratio
- **Dockerized** - one `docker compose up` builds and runs the full app;
  Langfuse's heavier observability stack is opt-in via a Compose profile

## Architecture

```
┌─────────────┐      ┌──────────────────────────────┐      ┌────────────────┐
│  Next.js UI │ ───▶ │         FastAPI backend        │ ───▶ │  LLM provider  │
│ (port 3100) │ ◀─── │          (port 8100)           │ ◀─── │ Ollama / OpenAI│
└─────────────┘      │                                │      │   / Anthropic  │
                      │  ┌──────────┐   ┌───────────┐ │      └────────────────┘
                      │  │  Chroma  │   │  SQLite   │ │
                      │  │ (vectors)│   │ (metadata,│ │      ┌────────────────┐
                      │  └──────────┘   │  history, │ │ ───▶ │    Langfuse    │
                      │                 │  feedback)│ │ ◀─── │  (port 3300,   │
                      │  ┌──────────────┴───────────┘ │      │ optional)      │
                      │  │  Ingestion: PyPDF, pandas,  │      └────────────────┘
                      │  │  WebBaseLoader, CSVLoader   │
                      │  └─────────────────────────────┘
                      └────────────────────────────────┘
```

- **Vector store**: Chroma, embedded/persistent (no separate server)
- **Metadata DB**: SQLite via SQLAlchemy (`documents`, `chat_messages`,
  `feedback` tables)
- **RAG chain**: LangChain LCEL `RunnableParallel` - retrieves top-k chunks,
  formats them as a numbered context block, and prompts the LLM to answer
  using only that context with `[n]` citations
- **Observability**: `langfuse.langchain.CallbackHandler` attached per
  request; feature-flagged via `ENABLE_LANGFUSE` so the app works fully
  without it

## Ports

| Service | URL | Notes |
|---|---|---|
| Frontend (Next.js) | http://localhost:3100 | Chat, Documents, Analytics UI |
| Backend API (FastAPI) | http://localhost:8100 | REST API + `/docs` (OpenAPI) |
| Langfuse UI | http://localhost:3300 | Optional, "langfuse" Compose profile |

These ports were chosen to avoid common local-dev defaults (8000, 8501,
11434), so the platform can run alongside other services on the same
machine.

## Project layout

```
backend/
  app/
    api/            FastAPI routers (documents, chat, feedback, analytics, health)
    config.py       pydantic-settings (.env driven)
    llm/            Multi-provider chat model + embeddings factory, prompts
    ingestion/      Loaders (PDF/Excel/CSV/URL), chunking, ingest pipeline
    rag/            Chroma vectorstore + LCEL RAG chain with citations
    observability/  Langfuse client, run-config builder, feedback scoring
    db/             SQLAlchemy models (documents, chat_messages, feedback)
    schemas/        Pydantic request/response models
  tests/            pytest suite (ingestion, API, observability)
  Dockerfile

frontend/
  src/
    app/            chat/, documents/, analytics/ pages (Next.js App Router)
    components/     chat/, documents/, layout/, ui/ (shadcn/ui)
    lib/            api.ts, session.ts, types.ts
  Dockerfile

docker-compose.yml  backend + frontend + optional Langfuse stack
.env.example        all configuration, documented inline
```

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up -d --build
```

Open http://localhost:3100 for the app and http://localhost:8100/docs for
the API. By default the backend talks to the host's Ollama daemon
(`phi3:mini`) and uses a local HuggingFace embedding model - no API keys
required.

To also run the self-hosted Langfuse observability stack:

```bash
# Generate secrets and paste into .env first:
openssl rand -hex 32   # -> LANGFUSE_NEXTAUTH_SECRET, LANGFUSE_ENCRYPTION_KEY,
                        #    LANGFUSE_SALT, and the *_PASSWORD vars
docker compose --profile langfuse up -d --build
```

Then sign in to http://localhost:3300 with `LANGFUSE_INIT_USER_EMAIL` /
`LANGFUSE_INIT_USER_PASSWORD`, copy `LANGFUSE_INIT_PROJECT_PUBLIC_KEY` /
`LANGFUSE_INIT_PROJECT_SECRET_KEY` into `LANGFUSE_PUBLIC_KEY` /
`LANGFUSE_SECRET_KEY`, set `ENABLE_LANGFUSE=true`, and restart the backend
(`docker compose up -d --build backend`).

## Quick start (local dev, no Docker)

### Backend

```bash
cd backend
uv sync
cp ../.env.example .env   # edit as needed
uv run uvicorn app.main:app --reload --port 8100
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # runs on port 3100
```

## Configuration

All configuration lives in `.env` (see `.env.example` for the full list with
inline docs). Key knobs:

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `ollama` | `ollama` \| `anthropic` \| `openai` |
| `OLLAMA_MODEL` | `phi3:mini` | Local model (already pulled for this host) |
| `EMBEDDING_PROVIDER` | `huggingface` | Independent of `LLM_PROVIDER`; `openai` is opt-in |
| `RETRIEVER_K` | `4` | Chunks retrieved per question |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `1000` / `150` | Text splitting for PDF/URL content |
| `ENABLE_LANGFUSE` | `false` | Toggle trace/feedback observability |

> Switching `EMBEDDING_PROVIDER` after documents are ingested requires
> re-ingestion - embeddings from different models live in different vector
> spaces.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + active provider config |
| POST | `/api/documents/upload` | Multipart upload (PDF/Excel/CSV) → ingest |
| POST | `/api/documents/url` | `{url}` → ingest webpage |
| GET | `/api/documents` | List ingested documents |
| DELETE | `/api/documents/{id}` | Remove a document's chunks + record |
| POST | `/api/chat` | `{message}` → `{answer, sources, trace_id, chat_message_id}` |
| POST | `/api/feedback` | `{chat_message_id or trace_id, score}` → records thumbs up/down |
| GET | `/api/analytics/summary` | Document/chat/feedback counts, positive ratio |

Every request is tagged with `X-Session-Id` / `X-User-Id` headers, generated
client-side and persisted in `localStorage` - a clean extension point for
real authentication later.

## Testing

```bash
cd backend
uv run pytest      # 16 tests: ingestion, API (upload/chat/feedback), observability
uv run ruff check .

cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

## Switching LLM providers

Set `LLM_PROVIDER=anthropic` (with `ANTHROPIC_API_KEY`) or
`LLM_PROVIDER=openai` (with `OPENAI_API_KEY`) and restart the backend.
Embeddings stay on the local HuggingFace model regardless, so existing
ingested documents remain searchable without re-ingestion.

## License

MIT - see [LICENSE](LICENSE).
