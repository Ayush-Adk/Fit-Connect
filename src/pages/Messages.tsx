
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

interface Chat {
  id: string;
  type: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  participants: {
    user_id: string;
    users: {
      full_name: string;
      avatar_url: string | null;
    };
  }[];
}

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    // Check for a chat parameter in the URL
    const chatIdFromUrl = searchParams.get('chat');
    if (chatIdFromUrl) {
      setSelectedChat(chatIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    } else if (!userLoading) {
      // Redirect to login if not authenticated
      navigate('/auth');
    }
  }, [user, userLoading, navigate]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    navigate(`/messages?chat=${chatId}`, { replace: true });
    
    // Mark all messages in this chat as read
    updateReadStatus(chatId);
  };
  
  const updateReadStatus = async (chatId: string) => {
    try {
      if (!user?.id) return;
      
      // Get all unread messages in this chat
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('chat_id', chatId)
        .not('sender_id', 'eq', user.id) // Only for messages not sent by the current user
        .not('read_by', 'cs', `{${user.id}}`); // Not already marked as read by current user
        
      if (error) throw error;
      
      // Update each message's read_by array to include the current user
      if (messages && messages.length > 0) {
        for (const message of messages) {
          const updatedReadBy = message.read_by ? [...message.read_by, user.id] : [user.id];
          
          await supabase
            .from('messages')
            .update({ read_by: updatedReadBy })
            .eq('id', message.id);
        }
      }
    } catch (error: any) {
      console.error("Error updating read status:", error.message);
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to view messages</div>;
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        onSelectChat={handleSelectChat}
      />
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} currentUserId={user.id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
