import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isPlaceholder = (key: string | undefined) => 
  !key || key.includes("your-supabase-") || key.trim() === "";

const hasValidUrl = supabaseUrl && !supabaseUrl.includes("your-supabase-");
const hasValidAnonKey = supabaseAnonKey && !isPlaceholder(supabaseAnonKey);
const hasValidServiceKey = supabaseServiceKey && !isPlaceholder(supabaseServiceKey);

if (!hasValidUrl || !hasValidAnonKey) {
  console.warn("⚠️ Warning: Supabase environment variables are missing or use placeholders. Database integrations will run in Mock Mode.");
}

// Client for general public/user operations. Authenticates with cookies/headers automatically in browser.
export const supabase = (hasValidUrl && hasValidAnonKey)
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as unknown as ReturnType<typeof createClient>;

// Client for database administrative tasks (e.g. bypassing RLS on server routes if needed)
export const supabaseAdmin = (hasValidUrl && hasValidServiceKey) 
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;


