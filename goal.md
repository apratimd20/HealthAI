# 🏥 Health AI — Project Documentation

## Project Overview

Health AI is a full-stack health and fitness application that generates personalized daily health plans including meals, workouts, water intake, and sleep recommendations based on the user's health profile and goals.

---

## Tech Stack

### Backend (`node-health-ai/`)
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Database & ODM |
| JWT (jsonwebtoken) | Authentication tokens (2-day expiry) |
| bcryptjs | Password hashing |
| Google Generative AI | Food image analysis (Gemini 1.5 Flash) |
| OpenAI | Food image analysis (GPT-4o-mini, streaming) |
| Multer | File uploads (food images) |
| dotenv | Environment configuration |
| CORS | Cross-origin resource sharing |
| ES Modules | `"type": "module"` throughout |

### Frontend (React App)
| Technology | Purpose |
|---|---|
| React 18 | UI library |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Axios | HTTP client with interceptors |
| React Hook Form | Form handling & validation |
| Framer Motion | Animations & transitions |
| React Icons | Icon library |
| Context API | Global state management |
| Tailwind CSS | Styling with tailwind CSS  |

---

## Backend Architecture

### Models

#### User Model
| Field | Type | Constraints |
|---|---|---|
| name | String | required, trimmed |
| email | String | required, unique, lowercase, trimmed |
| password | String | required, minlength 6, hashed via pre-save hook |

#### Goal Model
| Field | Type | Constraints |
|---|---|---|
| user | ObjectId (ref: User) | required |
| age | Number | required |
| gender | String | enum: Male, Female, Other — required |
| height | Number | required (cm) |
| weight | Number | required (kg) |
| targetWeight | Number | required (kg) |
| goal | String | required |
| activityLevel | String | required |
| foodPreference | String | default: "No Preference" |
| medicalConditions | [String] | default: [] |
| allergies | [String] | default: [] |
| sleepHours | Number | default: 8 |
| status | String | enum: active/inactive, default: active |

#### Food Model
| Field | Type | Constraints |
|---|---|---|
| name | String | required |
| category | String | enum: 18 categories |
| servingSize | Number | required |
| servingUnit | String | default: "g" |
| calories | Number | required |
| protein, carbs, fat, fiber, sugar, sodium | Number | default: 0 |
| foodPreference | String | enum: Vegetarian, Non-Vegetarian, Vegan |
| mealType | [String] | enum: Breakfast, Lunch, Dinner, Snacks |
| isActive | Boolean | default: true |

### API Endpoints

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/user/register` | ❌ | `{ name, email, password }` | `{ success, message, data: { id, name } }` |
| POST | `/api/user/login` | ❌ | `{ email, password }` | `{ success, token, message }` |
| POST | `/api/health/setGoal` | ✅ | `{ age, gender, height, weight, targetWeight, goal, activityLevel, foodPreference?, medicalConditions?, allergies?, sleepHours? }` | `{ success, message, data: goalObject }` |
| GET | `/api/health/activeGoal` | ✅ | — | `{ success, data: goalObject }` |
| GET | `/api/health/today` | ✅ | — | `{ success, message, data: planObject }` |
| POST | `/api/food/analyse` | ❌ | FormData with `image` field | `{ success, data: { foodName, calories, protein, carbohydrates, fat } }` |

### Authentication Flow
1. User registers → receives `{ success, message, data: { id, name } }`
2. User logs in → receives JWT token in `{ success, token, message }`
3. Token stored in localStorage
4. Token sent as `token` header on every authenticated request
5. Middleware extracts token from `req.cookies?.token || req.headers.token`
6. JWT decoded → user fetched from DB (minus password) → attached to `req.user`

### Services

#### Health Service
- `calculateBMI(height, weight)` → BMI number
- `calculateBMR(gender, age, height, weight)` → BMR calories
- `calculateTDEE(bmr, activityLevel)` → TDEE with activity multiplier
- `calculateCalories(tdee, goal)` → daily calories adjusted for goal
- `calculateWaterIntake(weight)` → water in Liters string
- `getSleepRecommendation()` → `{ duration, bedtime, wakeUp }`

#### Plan Service — `generateDailyPlan(goalData)`
Returns:
```json
{
  "bmi": 24.5,
  "bmr": 1800,
  "tdee": 2500,
  "calories": 2000,
  "water": "2.5 L",
  "sleep": { "duration": "8 Hours", "bedtime": "10:30 PM", "wakeUp": "6:30 AM" },
  "meals": {
    "breakfast": { "foods": [...], "totalCalories": 500, "targetCalories": 500 },
    "lunch": { ... },
    "snacks": { ... },
    "dinner": { ... }
  },
  "workout": { "morning": [], "evening": [], "duration": "", "caloriesBurn": 0 }
}
```

#### Meal calorie distribution: Breakfast 25%, Lunch 35%, Snacks 10%, Dinner 30%

### Backend Configuration
- Default Port: `5000`
- No CORS middleware currently configured in `app.js` (needs to be added)
- Uses `express.json()` for body parsing

---

## Frontend Structure

```
src/
├── assets/            # Static assets (images, icons)
├── animations/        # Framer Motion animation variants
├── components/        # Reusable UI components
│   ├── ui/            # Button, Input, Card, Toast, Loader
│   └── layout/        # Header, Sidebar, Footer
├── constants/         # App constants, enum values
├── context/           # AuthContext, ThemeContext
├── features/          # Feature-specific components
│   ├── auth/          # Login, Register
│   ├── onboarding/    # Goal setup steps
│   └── dashboard/     # Dashboard cards
├── hooks/             # Custom hooks (useAuth, useToast)
├── layouts/           # Page layouts (AuthLayout, DashboardLayout)
├── pages/             # Route pages
├── routes/            # Router config, ProtectedRoute
├── services/          # API service layer (axios instance)
├── styles/            # Global CSS, variables, reset
└── utils/             # Helper functions
```

---

## Goals & Objectives

1. **Backend-First Development** — Frontend is built to match the exact API contracts
2. **Production-Ready** — Scalable folder structure, reusable components, clean code
3. **Premium UI** — Inspired by Apple Health, Fitbit, WHOOP, Google Fit
4. **Smooth UX** — Framer Motion animations, skeleton loaders, proper error handling
5. **Mobile-First** — Responsive design that works on all screen sizes
6. **Future-Proof** — Dashboard designed for AI Chat, Progress Tracking, Weekly Reports

---

## Important Values for Forms

### Goal options
- Lose Weight, Gain Weight, Build Muscle, Maintain Weight

### Activity Levels
- Sedentary, Light, Moderate, Active, Very Active

### Gender
- Male, Female, Other

### Food Preference
- Vegetarian, Non-Vegetarian, Vegan, No Preference

---

## Environment Variables

### Backend
- `PORT` — Server port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `OPENAI_API_KEY` — OpenAI API key
- `GEMINI_API_KEY` — Google Gemini API key

### Frontend
- `VITE_API_BASE_URL` — Backend base URL (e.g., `http://localhost:5000/api`)
