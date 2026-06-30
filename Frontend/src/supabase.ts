// Supabase client used for Realtime subscriptions only.
// The actual data mutations go through the FastAPI backend.

import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL  as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
