import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    print("Connecting to Supabase...")
    return create_client(url, key)

supabase = None

def init_db():
    global supabase
    supabase = get_supabase()
    print("Supabase connected successfully!")
    return supabase