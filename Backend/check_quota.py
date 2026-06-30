import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {'YES' if api_key else 'NO'}")
print(f"Key starts with: {api_key[:10]}..." if api_key else "NO KEY FOUND")

genai.configure(api_key=api_key)

models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]

for model_name in models_to_try:
    print(f"\n--- Testing {model_name} ---")
    try:
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content("Say hello in one word")
        print(f"SUCCESS: {resp.text}")
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {str(e)[:200]}")
