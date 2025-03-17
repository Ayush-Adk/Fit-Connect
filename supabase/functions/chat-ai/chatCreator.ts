
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

export async function createChat(
  supabase: ReturnType<typeof createClient>,
  type: string,
  name: string | null,
  participants: string[],
  currentUserId: string
) {
  if (!participants.includes(currentUserId)) {
    throw new Error('Unauthorized: User must be a participant in the chat');
  }
  
  console.log("Creating chat with participants:", participants);
  
  // Create the chat
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .insert({
      type,
      name,
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single();
    
  if (chatError) {
    console.error("Chat creation error:", chatError);
    throw chatError;
  }
  
  // Add participants
  const participantRecords = participants.map(userId => ({
    chat_id: chatData.id,
    user_id: userId
  }));
  
  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert(participantRecords);
    
  if (participantsError) {
    console.error("Participant insertion error:", participantsError);
    throw participantsError;
  }
  
  return chatData;
}
