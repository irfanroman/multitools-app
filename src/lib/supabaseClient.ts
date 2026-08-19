import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eualvpxtqjcjicfbdgbe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1YWx2cHh0cWpjamljZmJkZ2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjkyMTEsImV4cCI6MjEwMjcwNTIxMX0.PQ7B3b-f7JQRqOL9tY4-vLljK42tmhpnArnH8WxDoj4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
