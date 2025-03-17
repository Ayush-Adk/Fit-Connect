
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ChatRequest {
  type: string;
  name: string | null;
  participants: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Make sure we're dealing with a POST request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Get the request body
    const requestData: ChatRequest = await req.json()
    
    // Validate the request data
    if (!requestData.type || !requestData.participants || !Array.isArray(requestData.participants)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data. Missing required fields.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get auth user
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the chat
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .insert({
        type: requestData.type,
        name: requestData.name,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (chatError) {
      console.error('Error creating chat:', chatError)
      return new Response(
        JSON.stringify({ error: 'Failed to create chat' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add all participants to the chat
    const chatParticipants = requestData.participants.map(participantId => ({
      chat_id: chat.id,
      user_id: participantId
    }))

    // Add the current user as well if they're not already in the participants list
    if (!requestData.participants.includes(user.id)) {
      chatParticipants.push({
        chat_id: chat.id,
        user_id: user.id
      })
    }

    const { error: participantsError } = await supabaseAdmin
      .from('chat_participants')
      .insert(chatParticipants)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      return new Response(
        JSON.stringify({ error: 'Failed to add participants to chat' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        id: chat.id,
        status: 'success',
        message: 'Chat created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
