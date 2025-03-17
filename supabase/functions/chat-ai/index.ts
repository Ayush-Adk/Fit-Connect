
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClients, getCurrentUser, corsHeaders } from "./utils.ts"
import { generateSuggestion } from "./suggestions.ts"
import { handleStoryUpload } from "./storyHandler.ts"
import { createChat } from "./chatCreator.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Parse the request body
    const { action, data } = await req.json()
    
    // Get the Supabase clients
    const { supabase, userSupabase } = getSupabaseClients(req);
    
    // Get the authenticated user
    const user = await getCurrentUser(userSupabase);

    // Handle different actions
    let result;
    
    if (action === 'suggest') {
      // AI chat suggestion
      const { messages, chatContext } = data;
      const suggestion = generateSuggestion(messages, chatContext);
      result = { suggestion };
    } 
    else if (action === 'uploadStory') {
      // Handle story upload
      const { imageData, caption, userId } = data;
      
      if (userId !== user.id) {
        throw new Error('Unauthorized: Cannot create story for another user');
      }
      
      result = await handleStoryUpload(supabase, imageData, caption, userId);
    }
    else if (action === 'create-chat') {
      // Create a new chat using service role (bypassing RLS)
      const { type, name, participants } = data;
      result = await createChat(supabase, type, name, participants, user.id);
    }
    else {
      throw new Error(`Unknown action: ${action}`);
    }

    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
