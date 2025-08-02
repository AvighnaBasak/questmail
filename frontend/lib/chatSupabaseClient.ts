import { createClient } from '@supabase/supabase-js'

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL as string;
const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY as string;
 
export const chatSupabase = createClient(chatSupabaseUrl, chatSupabaseAnonKey); 