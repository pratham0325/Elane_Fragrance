# ÉLANÉ — Luxury Fragrance E-Commerce (MERN Stack)

A full-stack luxury perfume e-commerce platform built with MongoDB, Express, React, and Node.js.

## Status

This project is being built in phases (see `docs/PHASES.md`). Each phase is fully coded and runnable
locally — it has **not** been executed inside the build sandbox (no network/DB access there), so run it
locally with the steps below and report any issues.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, GSAP, Zustand,
Axios, React Hook Form, Zod, Lucide React

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod, Helmet, CORS,
express-rate-limit

## Getting Started (local machine)

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas) — or use `docker-compose up mongodb`
- npm

### 2. Install dependencies
```bash
npm install --prefix backend
npm install --prefix frontend
npm install
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env   # fill in secrets
cp frontend/.env.example frontend/.env
```

### 4. Start frontend and backend
From the repository root, run:

```bash
npm run dev
```

This starts the backend at `http://localhost:5000` and the frontend at `http://localhost:5173`.

To populate sample data, run `npm --prefix backend run seed` separately.

### 5. Or run everything with Docker
```bash
docker-compose up --build
```

## Project Structure

```
elane-perfume/
  frontend/   React + TS storefront & admin UI
  backend/    Express + TS REST API
  docs/       Phase notes, API reference
```

See `docs/PHASES.md` for what's implemented so far and what's next.

---

# Scent Intelligence — AI Layer

ÉLANÉ's AI layer, branded **Scent Intelligence**, adds natural-language fragrance discovery and
an AI purchase advisor on top of the existing catalog. It is **additive** — every existing feature
(auth, cart, checkout, admin, orders) works unchanged, and the storefront degrades gracefully when
no AI provider is configured.

## AI Architecture

```
User Query
   ↓
React AI Search UI  (/scent-intelligence)
   ↓
Express API         (POST /api/ai/fragrance-search)
   ↓
Intent Extraction   (LLM → Zod-validated JSON, rule-based fallback)
   ↓
Structured Search Intent
   ↓
MongoDB hard filters + semantic/vector retrieval
   ↓
Deterministic Hybrid Ranking Engine
   ↓
Top-K matching products (real DB documents)
   ↓
AI explanation layer  (productIds validated against the retrieved set)
   ↓
React results UI
```

### The catalog-only guarantee

The LLM never selects products — the deterministic ranking engine does. The LLM only *explains*
candidates it was handed. Every `productId` returned by the model is validated against the set that
came out of MongoDB; anything unrecognised is discarded and a deterministic reason is used instead.
The model therefore cannot invent a product, price, note, rating, or stock level.

### Hybrid ranking

Scoring is deterministic and explainable, with configurable weights in
`backend/src/services/ai/rankingEngine.ts`:

```
Final Score = Semantic Similarity   × 0.45
            + Preference Match      × 0.25
            + Occasion/Season Match × 0.15
            + Price Fit             × 0.10
            + Popularity            × 0.05
```

Out-of-stock products are demoted (×0.4) rather than hidden. When embeddings are unavailable the
semantic component falls back to token-overlap lexical similarity, so ranking still works.

## AI Features

- **Natural-language fragrance search** — "a mature fragrance for office, not too sweet, under ₹3000"
- **Semantic product discovery** — embedding-based retrieval over a rich per-product text representation
- **AI product comparison** — select 2–3 fragrances and get a comparison table plus a single recommendation

## Setup

### 1. Configure a provider (optional)

In `backend/.env`:

```env
AI_PROVIDER=openai              # openai | anthropic | none
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
AI_TIMEOUT_MS=15000
AI_MAX_QUERY_LENGTH=500
```

`AI_BASE_URL` lets you point the OpenAI-compatible client at Groq, Together, Ollama, etc.
Leaving `AI_PROVIDER=none` is fully supported — search falls back to rule-based intent extraction
plus lexical ranking, and the UI shows a graceful notice.

### 2. Generate embeddings

```bash
cd backend
npm run embed            # only products missing/outdated embeddings
npm run embed -- --force # regenerate everything
```

Admins can also trigger this from **Admin → AI Management**.

### 3. MongoDB Atlas Vector Search (optional)

Embeddings are stored on the product document (`aiEmbedding`) and compared in-process by default,
which is fine at this catalog size. For Atlas-native vector search, create a search index named
`vector_index` on the `products` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "aiEmbedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

Then set `AI_VECTOR_SEARCH=true`. Adjust `numDimensions` to match your embedding model
(1536 for `text-embedding-3-small`).

## Example requests

```bash
# Natural-language search
curl -X POST http://localhost:5000/api/ai/fragrance-search \
  -H "Content-Type: application/json" \
  -d '{"query":"I want something fresh and subtle for college under 2000"}'

# Product comparison
curl -X POST http://localhost:5000/api/ai/compare \
  -H "Content-Type: application/json" \
  -d '{"productIds":["<id1>","<id2>"],"needs":"college and dates, nothing too strong"}'

# Is AI configured?
curl http://localhost:5000/api/ai/status

# Admin: index + usage stats (requires admin token)
curl http://localhost:5000/api/admin/ai/status -H "Authorization: Bearer <token>"
```

## Security

- API keys are server-side only; no key or prompt ever reaches the browser
- User text is wrapped in delimited data blocks, never concatenated into system instructions
- Injection delimiters are stripped before the text reaches a prompt
- All AI output is Zod-validated before use; invalid output triggers the deterministic path
- Dedicated rate limiter on `/api/ai` (12 req/min) on top of the global limiter
- Max query length enforced (500 chars, configurable)
- The AI has no database access — it only ever sees a small, pre-retrieved candidate array
