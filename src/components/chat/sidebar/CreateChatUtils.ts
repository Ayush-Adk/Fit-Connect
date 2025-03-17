
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createNewChat = async (
  type: string,
  name: string | null,
  participantIds: string[],
  currentUserId: string
): Promise<{ chatId: string | null; error: Error | null }> => {
  try {
    // First, check if direct chat already exists between these users
    if (type === 'direct' && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      
      // Find chats where both users are participants
      const { data: currentUserChats, error: currentUserError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);
        
      if (currentUserError) throw currentUserError;
      
      if (!currentUserChats || currentUserChats.length === 0) {
        // No chats found, create a new one
        console.log("No existing chats found for current user, will create new");
      } else {
        // Check if the other user is in any of these chats
        const chatIds = currentUserChats.map(p => p.chat_id);
        
        const { data: sharedChats, error: sharedChatsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', otherUserId)
          .in('chat_id', chatIds);
          
        if (sharedChatsError) throw sharedChatsError;
        
        if (sharedChats && sharedChats.length > 0) {
          // Get the chat details to verify it's a direct chat
          const { data: chatDetails, error: chatDetailsError } = await supabase
            .from('chats')
            .select('id, type')
            .eq('id', sharedChats[0].chat_id)
            .eq('type', 'direct')
            .single();
            
          if (!chatDetailsError && chatDetails) {
            return { chatId: chatDetails.id, error: null };
          }
        }
      }
    }

    console.log("Creating new chat with participants:", [currentUserId, ...participantIds]);
    
    // Call the edge function that uses service_role to bypass RLS
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        action: 'create-chat',
        data: {
          type,
          name,
          participants: [currentUserId, ...participantIds]
        }
      }
    });
    
    if (error) {
      console.error("Error creating chat through function:", error);
      throw error;
    }
    
    return { chatId: data.id, error: null };
  } catch (error) {
    console.error("Error in createNewChat:", error);
    return { chatId: null, error: error as Error };
  }
};
