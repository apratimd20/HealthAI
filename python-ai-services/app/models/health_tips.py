"""
Health tips database - fallback responses.
"""
from typing import List, Dict

HEALTH_TIPS: Dict[str, List[str]] = {
    "weight loss": [
        "🥗 Focus on portion control and eat more vegetables. Aim for a calorie deficit of 300-500 calories per day.",
        "🏃 Combine cardio and strength training for best results. Try 30 minutes of moderate exercise 5 days a week.",
        "💧 Drink 2-3 liters of water daily. It helps with metabolism and reduces hunger cravings.",
        "😴 Get 7-9 hours of quality sleep. Poor sleep can disrupt hunger hormones and metabolism.",
        "🍎 Replace processed snacks with whole foods like fruits, nuts, and vegetables.",
    ],
    "protein": [
        "🥩 Lean proteins: chicken breast, turkey, fish, eggs, and Greek yogurt.",
        "🌱 Plant proteins: lentils, chickpeas, tofu, quinoa, and edamame.",
        "🥜 Nuts and seeds: almonds, walnuts, chia seeds, flaxseeds, and pumpkin seeds.",
        "🍼 Greek yogurt and cottage cheese are protein-rich snacks.",
        "🐟 Salmon provides protein and healthy omega-3 fatty acids.",
    ],
    "water": [
        "💧 Aim for 8-10 glasses of water daily (2-3 liters).",
        "💧 Drink before meals to feel fuller and aid digestion.",
        "💧 Set reminders to drink water throughout the day.",
        "💧 Add lemon, cucumber, or mint for flavor.",
        "💧 Drink more when exercising or in hot weather.",
    ],
    "sleep": [
        "😴 Target 7-9 hours of quality sleep each night.",
        "🌙 Create a consistent bedtime routine.",
        "📱 Avoid screens 1 hour before bed.",
        "🧘 Try meditation or deep breathing before sleep.",
        "🌡️ Keep your bedroom cool, dark, and quiet.",
    ],
    "exercise": [
        "🏃 Aim for 150 minutes of moderate exercise per week.",
        "🏋️ Include strength training 2-3 times per week.",
        "🚶 Walking 10,000 steps daily is a good goal.",
        "🤸 Mix cardio, strength, and flexibility exercises.",
        "📈 Track your progress to stay motivated.",
    ],
    "stress": [
        "🧘 Practice deep breathing for 5 minutes daily.",
        "🚶 Take short walks during work breaks.",
        "🎵 Listen to calming music or nature sounds.",
        "📝 Journal your thoughts and feelings.",
        "🤝 Connect with friends and family regularly.",
    ],
    "general": [
        "🥗 Eat a balanced diet with plenty of fruits and vegetables.",
        "🏃 Stay active every day - even a 20-minute walk helps.",
        "😴 Prioritize sleep and stress management.",
        "💧 Stay hydrated throughout the day.",
        "🍽️ Eat mindfully and listen to your body's hunger cues.",
        "🌿 Include herbs and spices in your cooking.",
        "🥑 Choose healthy fats like avocados and olive oil.",
    ]
}

DEFAULT_TIPS = [
    "🥗 Eat a balanced diet with plenty of fruits and vegetables.",
    "🏃 Stay active every day - even a 20-minute walk helps.",
    "😴 Prioritize sleep and stress management.",
    "💧 Stay hydrated throughout the day.",
]

def get_tips_for_keyword(keyword: str) -> List[str]:
    """Get tips for a specific keyword"""
    return HEALTH_TIPS.get(keyword, DEFAULT_TIPS)

def get_all_categories() -> List[str]:
    """Get all health tip categories"""
    return list(HEALTH_TIPS.keys())