# 🏥 Health AI — Backend (Node + Express)

REST API for the Health AI application: authentication, personalized daily plans, food analysis, an AI health chat, an AI doctor consultation, the community feed, and push notifications.

---

## 🩺 AI Doctor Endpoint

The **Talk with AI Doctor** module in the frontend talks to this backend to power both **voice** and **text** consultations.

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/chat/doctor` | ✅ JWT (`token` header) | `{ message, history }` | `{ success, data: { message, timestamp, source } }` |

### How it works
1. The frontend sends the user's message (spoken transcript **or** typed text) plus the last few turns of conversation in `history`.
2. The controller loads the user + active goal for personalized context.
3. `generateDoctorResponse()` (in `src/services/chat.services.js`) tries **Groq** first, then falls back to **OpenAI** (`gpt-4o-mini`).
4. The doctor persona prompt guarantees safe, honest responses — it never claims to be a licensed doctor and recommends a real professional for serious symptoms.

> Voice (speech-to-text) and text chat both call this same endpoint, so a consultation can mix typing and talking seamlessly.

### Example
```json
// POST /api/chat/doctor
{
  "message": "I've had a mild headache for two days.",
  "history": [
    { "role": "assistant", "content": "Hello! I'm your AI Health Assistant. How are you feeling today?" }
  ]
}
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "message": "I'm sorry to hear that... Could you tell me...",
    "timestamp": "2026-08-03T12:00:00.000Z",
    "source": "groq"
  }
}
```

---

## 🔌 All API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/user/register` | ❌ | Register a user |
| POST | `/api/user/login` | ❌ | Login → JWT token |
| POST | `/api/health/setGoal` | ✅ | Create/update health goal |
| GET | `/api/health/activeGoal` | ✅ | Get active goal |
| GET | `/api/health/today` | ✅ | Today's personalized plan |
| POST | `/api/food/analyse` | ❌ | Food image → macros (Gemini/OpenAI) |
| POST | `/api/chat` | ✅ | AI health chat (non-streaming) |
| POST | `/api/chat-stream` | ✅ | AI health chat (SSE streaming) |
| POST | `/api/chat/doctor` | ✅ | **AI Doctor consultation** |
| GET | `/api/chat/history` | ✅ | Chat history (coming soon) |
| GET | `/api/chat/suggestions` | ✅ | Context-aware suggestions |
| POST | `/api/posts` | ✅ | Create community post |
| GET | `/api/posts` | ✅ | Get community feed |
| POST | `/api/notifications/subscribe` | ✅ | Web push subscription |
| GET | `/api/notifications/test` | ✅ | Send test push |
| GET | `/api/admin/*` | ✅ (admin) | Admin panel routes |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Database & ODM |
| JWT (jsonwebtoken) | Auth tokens (via `token` header) |
| bcryptjs | Password hashing |
| Groq SDK | Primary AI provider (`llama` models, fast) |
| OpenAI SDK | AI provider + fallback (`gpt-4o-mini`) |
| Google Generative AI | Food image analysis (Gemini) |
| Multer + Cloudinary + Sharp | Image uploads & processing |
| node-cron | Scheduled push notifications |
| web-push + VAPID | Web push notifications |
| Bottleneck | Rate limiting for AI/API calls |
| dotenv | Environment configuration |

---

## 🚀 Getting Started

### Prerequisites
- Node.js **18+**
- MongoDB (local or Atlas)
- API keys: Groq and/or OpenAI (AI chat/doctor)

### 1. Install & configure
```bash
cd node-health-ai
npm install
cp .env.example .env   # if present
```

`.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/health-ai

JWT_SECRET=your-secret

# AI providers (Groq is tried first for chat/doctor)
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

# Optional — food scanning & image storage
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional — push notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
EMAIL_FROM=
```

### 2. Run
```bash
npm run dev      # nodemon, auto-reload
npm start        # production
```
Server listens on **http://0.0.0.0:5000**.

### 3. Seed food data (optional)
Use `src/seed/food.seed.js` to populate the food catalog used by meal planning.

---

## 🔐 Authentication

1. Register/login → returns a JWT.
2. Frontend stores the token and sends it as the **`token` header** on every request.
3. `authUser` middleware decodes it and attaches `req.user`.
4. Expired/invalid tokens return `401`.

---

## 🩺 AI Doctor Safety

The doctor system prompt enforces:

- Never claiming to be a licensed doctor or replacing medical evaluation.
- Recommending a qualified professional for serious, persistent, or worsening symptoms.
- Urging emergency care for red-flag symptoms (chest pain, severe breathing difficulty, heavy bleeding, etc.).
- Asking 1–2 concise follow-up questions to understand symptoms before advising.

---

## 📁 Structure

```
src/
├── app.js                  # Express app, CORS, route mounting
├── config/                 # DB connection, Cloudinary
├── controllers/            # Request handlers (chat, food, goal, ...)
├── middleware/             # authUser, etc.
├── models/                 # Mongoose models
├── routes/                 # API routers
├── seed/                   # Food seed data
├── services/               # Business logic (AI, plans, meals, ...)
└── utils/cron.js           # Scheduled notifications
server.js                   # Entry point
```

---

## 📸 Screenshots

> _Screenshots to be added here._
