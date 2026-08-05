// services/conversation.services.js
// Session management + analytics for AI conversations. On finalization, the
// conversation is analyzed (via Groq/OpenAI when available, otherwise a local
// key-word heuristic) and tagged with topic, sentiment, summary, keywords, etc.
import OpenAI from 'openai';
import Conversation from '../models/conversation.model.js';
import { groqChat } from './groq.service.js';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of inactivity ends a session.

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export const getActiveConversation = async (userId, type) =>
  Conversation.findOne({ user: userId, type, status: 'active' })
    .sort({ startedAt: -1 });

// Start a new conversation and finalize any previous active one (fire-and-forget).
export const startConversation = async (userId, type) => {
  const previous = await getActiveConversation(userId, type);
  if (previous) {
    previous.status = 'ended';
    previous.endedAt = new Date();
    previous.durationSeconds = Math.max(
      0,
      Math.round((previous.endedAt - new Date(previous.startedAt)) / 1000)
    );
    await previous.save().catch(() => {});
    finalizeConversation(previous._id);
  }

  return Conversation.create({
    user: userId,
    type,
    sessionId: `sess_${crypto.randomUUID().replace(/-/g, '')}`,
    status: 'active',
    startedAt: new Date(),
    lastActiveAt: new Date(),
    messages: [],
  });
};

// Append a message to the current conversation (creating a new session if the
// previous one is stale). Returns { conversation, isNew }.
export const recordChatMessage = async ({ user, type, role, content, responseTimeMs, userThinkMs }) => {
  const now = new Date();

  let conversation = await getActiveConversation(user, type);
  let isNew = false;

  if (!conversation) {
    conversation = await startConversation(user, type);
    isNew = true;
  } else {
    const gap = now.getTime() - new Date(conversation.lastActiveAt).getTime();
    if (gap > SESSION_TIMEOUT_MS) {
      conversation.status = 'ended';
      conversation.endedAt = now;
      conversation.durationSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(conversation.startedAt).getTime()) / 1000)
      );
      await conversation.save().catch(() => {});
      finalizeConversation(conversation._id);
      conversation = await startConversation(user, type);
      isNew = true;
    }
  }

  conversation.messages.push({
    role,
    content,
    timestamp: now,
    responseTimeMs,
    userThinkMs,
  });

  conversation.userMessages = conversation.messages.filter((m) => m.role === 'user').length;
  conversation.aiMessages = conversation.messages.filter((m) => m.role === 'assistant').length;
  conversation.totalMessages = conversation.messages.length;
  conversation.lastActiveAt = now;
  conversation.endedAt = now;

  await conversation.save();
  return { conversation, isNew };
};

// ============================================================================
// AI analysis
// ============================================================================
const SENTIMENTS = ['Happy', 'Satisfied', 'Neutral', 'Confused', 'Angry', 'Frustrated', 'Emergency'];

const TOPIC_KEYWORDS = {
  Fever: ['fever', 'temperature', 'pyrexia', 'hot'],
  Cold: ['cold', 'cough', 'sneeze', 'runny nose', 'congestion', 'flu'],
  Headache: ['headache', 'migraine', 'head'],
  Diabetes: ['diabetes', 'blood sugar', 'glucose', 'sugar level', 'insulin'],
  'Mental Health': ['anxiety', 'stress', 'depression', 'mental', 'sleep', 'insomnia', 'mood', 'panic'],
  Nutrition: ['diet', 'nutrition', 'calorie', 'protein', 'food', 'weight loss', 'weight gain', 'meal'],
  Pregnancy: ['pregnant', 'pregnancy', 'antenatal'],
  'Skin Care': ['skin', 'acne', 'rash', 'eczema', 'dry skin'],
  Exercise: ['exercise', 'workout', 'fitness', 'gym', 'running'],
  Medication: ['medicine', 'medication', 'dosage', 'pills', 'tablet'],
  Heart: ['heart', 'chest pain', 'palpitation', 'bp', 'blood pressure'],
  Sleep: ['sleep', 'insomnia', 'tired'],
};

const SYMPTOM_KEYWORDS = [
  'fever', 'headache', 'cough', 'cold', 'pain', 'nausea', 'fatigue', 'dizziness',
  'rash', 'acne', 'vomiting', 'diarrhea', 'constipation', 'shortness of breath',
  'chest pain', 'sore throat', 'muscle ache', 'back pain', 'stomach', 'cramps',
  'itching', 'bloating', 'tired', 'weakness',
];

const MEDICINE_KEYWORDS = [
  'paracetamol', 'ibuprofen', 'aspirin', 'antihistamine', 'insulin', 'amoxicillin',
  'antibiotic', 'painkiller', 'metformin', 'steroid', 'cough syrup',
];

const DISEASE_KEYWORDS = [
  'diabetes', 'hypertension', 'asthma', 'thyroid', 'anemia', 'arthritis', 'cancer',
  'heart disease', 'tuberculosis', 'migraine', 'pneumonia', 'depression', 'allergy',
  'ulcer', 'pcos', 'hyperthyroidism', 'hypothyroidism',
];

const EMERGENCY_KEYWORDS = [
  'emergency', 'severe', 'unconscious', 'bleeding heavily', 'difficulty breathing',
  'cannot breathe', 'seizure', 'stroke', 'heart attack', 'suicide', 'overdose', 'fainting', 'chest pain',
];

function heuristicAnalysis(text, userCount, aiCount) {
  const lower = text.toLowerCase();

  let topic = 'General Health';
  let best = 0;
  for (const [label, words] of Object.entries(TOPIC_KEYWORDS)) {
    const score = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (score > best) {
      best = score;
      topic = label;
    }
  }

  const isEmergency = EMERGENCY_KEYWORDS.some((w) => lower.includes(w));
  let sentiment = 'Neutral';
  if (isEmergency) sentiment = 'Emergency';
  else if (/thank|cannot|great|happy|nice|helpful|good|love the answer/.test(lower)) sentiment = 'Happy';
  else if (/ok|okay|fine|understood|makes sense/.test(lower)) sentiment = 'Satisfied';
  else if (/\?+/.test(lower) && /(what|how|why|when|can't|dont understand|could you).*/.test(lower)) sentiment = 'Confused';
  else if (/(angry|frustrated|annoyed|useless|bad|terrible|not working|unhelpful|disappointed)/.test(lower)) sentiment = 'Frustrated';

  const symptoms = Array.from(new Set(SYMPTOM_KEYWORDS.filter((w) => lower.includes(w))));
  const medicines = Array.from(new Set(MEDICINE_KEYWORDS.filter((w) => lower.includes(w))));
  const diseases = Array.from(new Set(DISEASE_KEYWORDS.filter((w) => lower.includes(w))));

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['and', 'the', 'with', 'that', 'this', 'have', 'you', 'your', 'what', 'about', 'does', 'would', 'should', 'their', 'were', 'when', 'from', 'them', 'then', 'than', 'will'].includes(w));
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);

  const resolved = /(thank you|thanks|got it|understood|cannot that helps|thankyou)/.test(lower) && !isEmergency;

  const summary = text.length > 60 ? `${text.slice(0, 160)}...` : text || 'No content';

  return {
    topic,
    sentiment,
    mood: sentiment === 'Happy' ? 'Positive' : sentiment === 'Frustrated' ? 'Negative' : sentiment === 'Emergency' ? 'Alert' : 'Calm',
    summary,
    keywords,
    mentionedSymptoms: symptoms,
    mentionedMedicines: medicines,
    mentionedDiseases: diseases,
    resolved,
    satisfactionScore: isEmergency ? 1 : resolved ? 4 : 3,
  };
}

// Proxy that catches and returns null on failure so the caller falls back
// to the local heuristic.
const analyzeProxy = async (msgs) => {
  try {
    return await aiAnalysis(msgs);
  } catch {
    return null;
  }
};

async function aiAnalysis(messages) {
  const transcript = messages
    .map((m) => (m.role === 'user' ? `User: ${m.content}` : `Doctor: ${m.content}`))
    .join('\n');

  const prompt = `Analyze this health conversation. Return STRICT JSON (no markdown, no commentary) with this exact shape:
{
  "summary": "one concise sentence of 1-2 lines",
  "sentiment": "Happy|Satisfied|Neutral|Confused|Angry|Frustrated|Emergency",
  "mood": "one word",
  "topic": "Cold|Fever|Headache|Diabetes|Mental Health|Nutrition|Pregnancy|Skin Care|Exercise|Medication|Sleep|Digestion|Heart|General Health",
  "keywords": ["...","..."],
  "mentionedSymptoms": ["..."],
  "mentionedMedicines": ["..."],
  "mentionedDiseases": ["..."],
  "resolved": true/false,
  "satisfactionScore": integer 1-5
}
Conversation:\n${transcript}`;

  // Try Groq first.
  try {
    const groqText = await groqChat(prompt, 'You are a concise healthcare conversation analyst that only returns JSON.', []);
    if (groqText) {
      const parsed = JSON.parse(groqText.slice(groqText.indexOf('{'), groqText.lastIndexOf('}') + 1));
      if (parsed) return normalizeAnalyze(parsed);
    }
  } catch (e) {
    /* fall through */
  }

  // OpenAI JSON fallback.
  try {
    const client = getOpenAIClient();
    if (client) {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You return JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      });
      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed) return normalizeAnalyze(parsed);
    }
  } catch (e) {
    /* fall through */
  }

  return null;
}

function normalizeAnalyze(data) {
  const topic = typeof data.topic === 'string' && data.topic ? data.topic : 'General Health';
  return {
    topic,
    sentiment: SENTIMENTS.includes(data.sentiment) ? data.sentiment : 'Neutral',
    mood: data.mood || 'Neutral',
    summary: typeof data.summary === 'string' ? data.summary : '',
    keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 12) : [],
    mentionedSymptoms: Array.isArray(data.mentionedSymptoms) ? data.mentionedSymptoms.slice(0, 10) : [],
    mentionedMedicines: Array.isArray(data.mentionedMedicines) ? data.mentionedMedicines.slice(0, 10) : [],
    mentionedDiseases: Array.isArray(data.mentionedDiseases) ? data.mentionedDiseases.slice(0, 10) : [],
    resolved: Boolean(data.resolved),
    satisfactionScore: Math.min(5, Math.max(1, Number(data.satisfactionScore) || 3)),
  };
}

// Finalize a conversation's analytics (AI first, heuristic fallback). Non-blocking.
export const finalizeConversation = async (conversationId) => {
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.totalMessages === 0) return;

    const end = conversation.endedAt || new Date();
    conversation.durationSeconds = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(conversation.startedAt).getTime()) / 1000)
    );

    const messages = conversation.messages || [];
    const text = messages.map((m) => m.content).join(' ');

    const aiResult = await analyzeProxy(messages);
    const result = aiResult || heuristicAnalysis(text, conversation.userMessages, conversation.aiMessages);

    conversation.topic = result.topic;
    conversation.sentiment = result.sentiment;
    conversation.mood = result.mood;
    conversation.summary = result.summary;
    conversation.keywords = result.keywords;
    conversation.mentionedSymptoms = result.mentionedSymptoms;
    conversation.mentionedMedicines = result.mentionedMedicines;
    conversation.mentionedDiseases = result.mentionedDiseases;
    conversation.resolved = result.resolved;
    conversation.satisfactionScore = result.satisfactionScore;

    const aiResTimes = messages.filter((m) => m.role === 'assistant' && m.responseTimeMs).map((m) => m.responseTimeMs);
    const userTimes = messages.filter((m) => m.role === 'user' && m.userThinkMs).map((m) => m.userThinkMs);
    conversation.avgAiResponseMs = aiResTimes.length ? Math.round(aiResTimes.reduce((a, b) => a + b, 0) / aiResTimes.length) : 0;
    conversation.avgUserResponseMs = userTimes.length ? Math.round(userTimes.reduce((a, b) => a + b, 0) / userTimes.length) : 0;

    await conversation.save();
  } catch (error) {
    console.error('[CONV] finalize error:', error?.message);
  }
};

export const finalizeStaleConversations = async () => {
  const threshold = new Date(Date.now() - SESSION_TIMEOUT_MS);
  const stale = await Conversation.find({ status: 'active', lastActiveAt: { $lt: threshold } });
  for (const conversation of stale) {
    conversation.status = 'ended';
    conversation.endedAt = conversation.lastActiveAt || new Date();
    conversation.durationSeconds = Math.max(
      0,
      Math.round((new Date(conversation.endedAt).getTime() - new Date(conversation.startedAt).getTime()) / 1000)
    );
    await conversation.save().catch(() => {});
    finalizeConversation(conversation._id);
  }
  return stale.length;
};