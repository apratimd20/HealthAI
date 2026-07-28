# test_gemini.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")

print("=" * 50)
print("🔍 Testing Gemini API Key")
print("=" * 50)

if not api_key:
    print("❌ GEMINI_API_KEY not found in .env file!")
    print("💡 Please add: GEMINI_API_KEY=AIzaSy...")
    exit(1)

print(f"✅ API Key found: {api_key[:10]}...{api_key[-5:]}")
print(f"📏 Key length: {len(api_key)} characters")

try:
    # Configure Gemini
    genai.configure(api_key=api_key)
    print("✅ Gemini configured successfully!")
    
    # Try different models
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-pro", 
        "gemini-pro",
        "gemini-pro-vision",
    ]
    
    working_model = None
    
    for model_name in models_to_try:
        try:
            print(f"\n🔄 Testing model: {model_name}")
            model = genai.GenerativeModel(model_name)
            
            # Simple test
            response = model.generate_content("Say 'Hello, Gemini is working!'")
            
            if response and response.text:
                print(f"✅ Model {model_name} is WORKING!")
                print(f"📝 Response: {response.text[:100]}...")
                working_model = model_name
                break
                
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg:
                print(f"❌ Model {model_name} not found (404)")
            elif "403" in error_msg:
                print(f"❌ Model {model_name} access denied (403)")
            elif "429" in error_msg:
                print(f"⚠️ Rate limit for {model_name}")
            else:
                print(f"❌ Model {model_name} failed: {e}")
    
    if working_model:
        print(f"\n🎉 SUCCESS! Gemini is working with model: {working_model}")
    else:
        print("\n❌ No Gemini model worked!")
        print("💡 Possible issues:")
        print("   1. API key is invalid or expired")
        print("   2. Gemini API is not enabled for this key")
        print("   3. Your region doesn't support Gemini")
        print("\n💡 Try getting a new key from: https://aistudio.google.com/apikey")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("💡 Make sure the google-generativeai package is installed:")
    print("   pip install google-generativeai")

print("\n" + "=" * 50)