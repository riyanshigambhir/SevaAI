import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Set GEMINI_API_KEY environment variable first")
    exit(1)

genai.configure(api_key=api_key)

print("Models available to your key that support generateContent:\n")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"  {m.name}")