
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

export const getSupabaseClients = (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  // Get the authorization header from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }
  
  // Create a Supabase client with the user's JWT
  const userSupabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  
  return { supabase, userSupabase };
};

export const getCurrentUser = async (userSupabase: ReturnType<typeof createClient>) => {
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Invalid user or authentication');
  }
  return user;
};

export { corsHeaders };
