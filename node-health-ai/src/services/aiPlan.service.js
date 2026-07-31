
import Groq from 'groq-sdk';

let groqClient = null;

function getClient() {
    if (groqClient) return groqClient;
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    groqClient = new Groq({ apiKey: key });
    return groqClient;
}

async function groqGenerate(prompt, systemPrompt) {
    const client = getClient();
    if (!client) return null;
    try {
        const res = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });
        return res.choices[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('Groq AI plan error:', e.message);
        return null;
    }
}

export async function getGoalSuggestions(age, gender, height, weight) {
    const bmi = weight / ((height / 100) ** 2);
    let bmiCategory = 'Normal';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
    else if (bmi >= 30) bmiCategory = 'Obese';

    let suggestedGoal = 'maintain';
    let suggestedWeight = weight;
    if (bmi < 18.5) { suggestedGoal = 'gain'; suggestedWeight = +(weight * 1.08).toFixed(1); }
    else if (bmi > 24.9) { suggestedGoal = 'lose'; suggestedWeight = +(weight * 0.92).toFixed(1); }

    const maxTarget = +(weight * 1.2).toFixed(1);
    const minTarget = +(weight * 0.8).toFixed(1);

    return {
        bmi: +bmi.toFixed(1),
        bmiCategory,
        suggestedGoal,
        suggestedTargetWeight: Math.min(maxTarget, Math.max(minTarget, suggestedWeight)),
        targetWeightRange: { min: minTarget, max: maxTarget },
        healthWarning: bmi < 18.5 ? 'You are underweight. Gaining weight is recommended.' :
                       bmi > 30 ? 'You are in the obese range. Consider consulting a doctor.' : null,
    };
}

export async function generateAIPlan(goal) {
    const systemPrompt = `You are NutriAI, a health plan generator. Return ONLY valid JSON. No markdown, no explanation.`;

    const prompt = `Generate a daily health plan for this user and return ONLY JSON:
{
  "userProfile": {
    "age": ${goal.age},
    "gender": "${goal.gender}",
    "height": ${goal.height}cm,
    "weight": ${goal.weight}kg,
    "bmi": ${(goal.weight / ((goal.height/100)**2)).toFixed(1)},
    "goal": "${goal.goal}",
    "targetWeight": ${goal.targetWeight}kg,
    "activityLevel": "${goal.activityLevel}",
    "foodPreference": "${goal.foodPreference}"
  },
  "dailyPlan": {
    "calories": 0,
    "protein": "Xg",
    "carbs": "Xg",
    "fat": "Xg",
    "water": "XL",
    "sleep": "X hours",
    "meals": {
      "breakfast": ["item1", "item2"],
      "lunch": ["item1", "item2"],
      "snacks": ["item1"],
      "dinner": ["item1", "item2"]
    },
    "workout": {
      "type": "e.g. mixed",
      "duration": "X mins",
      "schedule": "e.g. 3 days/week"
    },
    "tips": ["tip1", "tip2", "tip3"]
  }
}

Rules:
- Calories: if goal is lose, 300-500 below TDEE; if gain, 300-500 above; if maintain, at TDEE
- Meals must match foodPreference: ${goal.foodPreference}
- ${goal.medicalConditions?.length ? `Avoid foods that conflict with: ${goal.medicalConditions.join(', ')}` : ''}
- ${goal.allergies?.length ? `Avoid: ${goal.allergies.join(', ')}` : ''}
- Workout must match activity level: ${goal.activityLevel}
- Be realistic and safe. Return ONLY the JSON object.`;

    const result = await groqGenerate(prompt, systemPrompt);
    if (!result) return null;
    try {
        const json = JSON.parse(result.replace(/```json|```/g, '').trim());
        return json;
    } catch {
        const match = result.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        return null;
    }
}
