# 🏥 Health AI — Frontend

A modern, mobile-first health & fitness web application with an AI-powered doctor consultation feature. Built with **React 19**, **Vite**, **Tailwind CSS 4**, and **Three.js**.

> ⚕️ **Talk with AI Doctor** — a full-screen, video-call–style consultation with an animated 3D AI doctor. You can talk hands-free with your voice **or** type messages, all in one shared conversation.

---

## ✨ Features

### 🩺 Talk with AI Doctor
- **Voice conversation** — continuous speech recognition with automatic restart, so the conversation never drops after silence.
- **Text chat** — type a message, press `Enter`, or tap Send. Voice and text share the **same** conversation history.
- **Animated 3D doctor avatar** — a professional human doctor rendered in real time with:
  - Eye blinking
  - Lip sync while speaking
  - Idle breathing & head sway
  - Friendly facial expressions
- **Video-call UI** — floating call controls, live status indicator, and a slide-in chat drawer.
- **Safe & honest AI** — the assistant never claims to be a licensed doctor and always recommends consulting a real professional for serious symptoms.
- **Privacy-first** — no external avatars, images, or API keys required for the 3D model; everything runs locally in the browser.

### 🍎 Other modules
- Personalized daily health plans (meals, workouts, water, sleep) generated from your goal
- AI food scanner (camera capture + upload) with macro estimation
- AI health chat with streaming responses
- Health community feed
- Push notifications + PWA (installable)

---

## 🔄 AI Doctor Workflow

```
Start Call
   │
   ▼
Doctor speaks greeting (TTS)
   │
   ▼
Microphone listens (continuous)
   │
   ▼
You speak ──► transcript (final) ──► POST /api/chat/doctor
   │                                    (Groq → OpenAI fallback, with your goal/user context)
   │                                    │
   │                                    ▼
   │                              AI response
   │                                    │
   ▼                                    ▼
Voice → TTS reads reply          Text → shown in chat drawer
   │                                    │
   └──────────────► resume listening ◄──┘
```

Both **voice** and **text** input funnel through the same backend endpoint (`/api/chat/doctor`) and the same client-side pipeline, so the doctor stays context-aware across the whole consultation.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Styling (`@theme` tokens, utility classes) |
| Framer Motion | Page/card/status animations |
| Three.js + @react-three/fiber + @react-three/drei | Real-time 3D doctor avatar |
| React Router 7 | Client-side routing (protected routes) |
| Axios | HTTP client with auth interceptors |
| React Markdown + remark-gfm | Rendered AI responses in chat |
| Web Speech API | Speech recognition (`SpeechRecognition`) & synthesis (`speechSynthesis`) — no external service |
| React Hot Toast | Toast notifications |
| Vite Plugin PWA | Offline support / installability |
| Oxlint | Linting |

### New dependencies for the AI Doctor module
- `three`
- `@react-three/fiber`
- `@react-three/drei`

These are **free and open-source**; the 3D avatar is built procedurally in code, so **no API keys, model files, or network requests** are required for the avatar.

---

## 🌐 Browser Requirements

Voice recognition uses the **Web Speech API**. For the best experience use a Chromium browser:

| Feature | Requirement |
|---|---|
| 🎤 Speech recognition | Chrome / Edge (Chromium). Not supported in Firefox/Safari. |
| 🗣️ Speech synthesis | Chrome, Edge, Safari, Firefox (varies by OS/voice availability) |
| 3D avatar (WebGL) | Any browser with WebGL enabled (all modern browsers) |
| Microphone | Physical or virtual mic, with permission granted |

> ⚠️ Speech recognition runs on **HTTPS** (or `localhost`). The mic will not work on plain HTTP in most browsers.

---

## 🚀 Getting Started

### Prerequisites
- Node.js **20.19+** (Vite 8 requirement)
- MongoDB instance (local or Atlas)
- Backend running (see [`node-health-ai` README](../node-health-ai/README.md))

### 1. Install & configure
```bash
cd health-ai-frontend
npm install
cp .env.example .env   # if present; otherwise create .env
```

`.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Run the dev server
```bash
npm run dev
```
Open **http://localhost:5173** (or the printed URL).

### 3. Build for production
```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

### 4. Lint
```bash
npm run lint
```

> The backend must be running on port `5000` for chat, goals, food scanning, and the feed to work. See the backend README for setup.

---

## 📁 Project Structure (AI Doctor module)

```
src/pages/TalkWithDoctor/
├── TalkWithDoctorPage.jsx        # Full-screen video-call layout
├── components/
│   ├── DoctorAvatar.jsx          # 3D doctor (blink, lip sync, idle, expressions)
│   ├── DoctorHeader.jsx          # Top bar (leave, identity, live badge)
│   ├── CallControls.jsx          # Mic / Chat / End call (+ hidden camera)
│   ├── ConversationStatus.jsx    # Live status pill (listening/thinking/speaking)
│   ├── SpeechPlayer.jsx          # Animated equalizer while the doctor speaks
│   ├── ChatDrawer.jsx            # Slide-in chat (voice + text history)
│   └── MessageBubble.jsx         # Markdown-rendered bubbles with timestamps
├── hooks/
│   ├── useConversation.js        # Orchestrates voice + text → AI → TTS
│   ├── useSpeechRecognition.js   # Continuous mic listening (Web Speech API)
│   └── useSpeechSynthesis.js     # Natural doctor voice (TTS)
└── services/
    └── doctorApi.js              # POST /chat/doctor client
```

---

## 🧭 Roadmap

- [ ] **Lip sync via visemes** — map speech to exact mouth shapes instead of an envelope
- [ ] **Webcam video call** — camera button is implemented but hidden (`CAMERA_ENABLED` in `CallControls.jsx`)
- [ ] **Avatar gestures & head tracking**
- [ ] **Conversation history persistence** across sessions
- [ ] **Multi-language support** (speech recognition + TTS)

---

## ⚠️ Limitations

- Voice recognition requires Chrome/Edge on HTTPS.
- The AI doctor is an **informational assistant, not a doctor** — it will recommend a real professional for serious concerns.
- 3D avatar is procedural (not photorealistic); it renders from primitive geometry for performance and zero asset dependencies.

---

## 📸 Screenshots

> _Screenshots to be added here._

---

## 📄 License

ISC — see [`node-health-ai`](../node-health-ai/README.md) for backend details.
