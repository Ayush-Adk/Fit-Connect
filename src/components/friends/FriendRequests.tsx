
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FriendRequest {
  id: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const FriendRequests = ({ onUpdateRequests }: { onUpdateRequests?: () => void }) => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFriendRequests();
    
    // Subscribe to friend requests changes
    const channel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests'
        },
        () => {
          loadFriendRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Specify the sender_id column explicitly to avoid relationship ambiguity
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          created_at,
          sender_id,
          sender:users!friend_requests_sender_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      // Transform the data to match our interface
      const formattedRequests = data?.map(item => ({
        id: item.id,
        created_at: item.created_at,
        sender: item.sender
      })) || [];
      
      setFriendRequests(formattedRequests);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (otherUserId: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Check if a direct chat already exists between the two users
      const { data: existingChats } = await supabase
        .from('chats')
        .select(`
          id,
          participants:chat_participants(user_id)
        `)
        .eq('type', 'direct');
      
      // Filter chats to find one with exactly these two participants
      const directChat = existingChats?.find(chat => {
        const participants = chat.participants.map((p: any) => p.user_id);
        return participants.includes(user.id) && 
               participants.includes(otherUserId) &&
               participants.length === 2;
      });
      
      if (directChat) {
        return directChat.id;
      }
      
      // If no existing chat, create a new one
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add participants to the chat
      const participants = [
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: otherUserId }
      ];
      
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);
      
      if (participantError) throw participantError;
      
      return newChat.id;
    } catch (error: any) {
      console.error("Error creating chat:", error.message);
      toast.error("Failed to create chat");
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string, senderName: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      
      // Create a new chat between the users
      const chatId = await createChat(senderId);

      setFriendRequests(prev => prev.filter(request => request.id !== requestId));
      toast.success(`You are now friends with ${senderName}`);
      
      if (onUpdateRequests) {
        onUpdateRequests();
      }
      
      // Ask if user wants to start chatting with their new friend
      toast("Chat with your new friend?", {
        action: {
          label: "Chat Now",
          onClick: () => navigate(`/messages?chat=${chatId}`)
        },
        duration: 5000,
      });
    } catch (error: any) {
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      setFriendRequests(prev => prev.filter(request => request.id !== requestId));
      toast.success("Friend request rejected");
      
      if (onUpdateRequests) {
        onUpdateRequests();
      }
    } catch (error: any) {
      toast.error("Failed to reject friend request");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading friend requests...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
      
      {friendRequests.length > 0 ? (
        friendRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.sender.avatar_url || ""} alt={request.sender.full_name} />
                <AvatarFallback>{request.sender.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.sender.full_name}</p>
                <p className="text-gray-500 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptFriendRequest(request.id, request.sender.full_name, request.sender.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectFriendRequest(request.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No pending friend requests</p>
        </div>
      )}
    </div>
  );
};
