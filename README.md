# ChatRecall

ChatRecall is a full-stack realtime chat application with persistent chat history and AI-powered recall. Users can create rooms, exchange Socket.IO messages, search past conversations semantically, ask RAG-backed questions, and summarize chats with Gemini.

The project is built as an internship/showcase-ready MERN-style application with MongoDB as the durable source of truth and ChromaDB as the vector index for retrieval.

## Architecture

```text
React frontend
  |  Axios REST API calls
  |  Socket.IO client with JWT auth
  v
Express backend
  |  Auth/routes/middleware
  |  Socket.IO room and message handlers
  |  Gemini embedding + generation services
  |  ChromaDB vector upsert/query service
  v
MongoDB ---------------------> ChromaDB
source of truth               vector index
users, rooms, messages        Gemini-generated message embeddings

Gemini API
  |  embeddings for messages/search questions
  |  summaries and RAG answers
```

## Features

- JWT authentication with protected REST routes and authenticated Socket.IO connections.
- Realtime chat rooms with join, leave, message broadcast, reconnect-safe socket lifecycle, and message persistence.
- MongoDB-backed users, chatrooms, and messages.
- ChromaDB semantic indexing using externally generated Gemini embeddings.
- Semantic Search across accessible chat history.
- RAG Q&A that retrieves relevant chat context before calling Gemini.
- Chat summarization with markdown rendering in the frontend.
- AI status endpoint for Gemini and ChromaDB availability.
- Graceful degradation when Gemini or ChromaDB is unavailable.

## Tech Stack

- Frontend: React, React Router, Axios, Socket.IO Client, Tailwind CSS, React Toastify, React Markdown
- Backend: Node.js, Express 5, Socket.IO, Mongoose, JWT, bcryptjs
- Database: MongoDB
- Vector database: ChromaDB
- AI: Gemini API via `@google/generative-ai` and Gemini REST generation endpoints

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Environment Variables

Create `backend/.env`:

```bash
PORT=5050
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chatrecall
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
GEMINI_API_KEY=your-gemini-api-key
CHROMADB_URL=http://localhost:8000
VECTOR_COLLECTION=chat_vectors
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Optional Chroma connection alternative:

```bash
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_SSL=false
```

Create `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:5050/api
REACT_APP_SOCKET_URL=http://localhost:5050
REACT_APP_APP_NAME=Chat Recall
```

For production, set `NODE_ENV=production`, use deployment URLs in `FRONTEND_URL`, `REACT_APP_API_URL`, and `REACT_APP_SOCKET_URL`, and use a strong `JWT_SECRET`. `FRONTEND_URL` supports comma-separated allowed origins.

## MongoDB Setup

MongoDB is the source of truth. The backend does not fall back to an in-memory database.

Local MongoDB example:

```bash
mongod
```

Then set:

```bash
MONGODB_URI=mongodb://localhost:27017/chatrecall
```

If MongoDB is unavailable, backend startup fails intentionally so chat history is not silently lost.

## ChromaDB Setup

Start ChromaDB locally:

```bash
chroma run --host localhost --port 8000
```

Then set:

```bash
CHROMADB_URL=http://localhost:8000
VECTOR_COLLECTION=chat_vectors
```

ChatRecall generates embeddings through Gemini and passes vectors explicitly to ChromaDB during `upsert` and `query`. Do not add `@chroma-core/default-embed`; the collection is configured for externally supplied embeddings.

## Gemini Setup

Create a Gemini API key in Google AI Studio and set:

```bash
GEMINI_API_KEY=your-gemini-api-key
```

Gemini is used for:

- `gemini-embedding-001` embeddings for messages and search questions.
- `gemini-2.5-flash` generation for summaries and RAG Q&A answers.

If Gemini quota is exhausted, the backend returns a clear quota error instead of crashing.

## Running Locally

Start MongoDB and ChromaDB first.

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm start
```

Open:

```text
http://localhost:3000
```

## AI and RAG Workflow

1. A user sends a chat message.
2. The backend writes the message to MongoDB.
3. The message model post-save hook indexes the message into ChromaDB.
4. If the message does not already have an embedding, Gemini creates one.
5. ChromaDB stores the message text, metadata, and embedding.
6. For Q&A, the question is embedded with Gemini.
7. ChromaDB retrieves relevant accessible messages.
8. The backend sends only retrieved context to Gemini.
9. Gemini returns an answer grounded in the chat history.

## Semantic Search

Semantic Search embeds a natural-language query and retrieves similar message vectors from ChromaDB. Search can run across all accessible rooms or be scoped to a single room. MongoDB remains authoritative for durable chat data; ChromaDB is the retrieval index.

## Screenshots

Add screenshots here when preparing a portfolio or resume submission:

- Login and registration
- Dashboard and room list
- Realtime chat room
- Semantic Search results
- RAG Q&A answer with sources
- Chat summary modal

## Resume-Worthy Highlights

- Built a realtime authenticated chat system with Socket.IO and JWT.
- Designed MongoDB persistence as the source of truth for all important application data.
- Integrated Gemini embeddings and generation into a RAG pipeline.
- Used ChromaDB for vector retrieval while keeping embedding generation external.
- Implemented AI feature health checks and graceful quota/service failure handling.
- Hardened auth, authorization, CORS, rate limiting, schema validation, and startup behavior.

## Production Notes

- Configure production environment variables before deploy.
- Use HTTPS deployment URLs for frontend and backend.
- Use a long random `JWT_SECRET`; production startup rejects weak secrets.
- Run MongoDB and ChromaDB as persistent services.
- Monitor Gemini quota and API errors.
- Keep `.env` files out of git.

## Future Improvements

- Add automated backend integration tests for auth, rooms, sockets, and AI routes.
- Add frontend component tests for auth and chat flows.
- Add message pagination and infinite scroll.
- Add production logging/observability with structured logs.
- Add account/profile management if needed.
- Add deployment-specific docs for Render, Railway, Fly.io, or Vercel.
