
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNewChat } from "./CreateChatUtils";
import FriendsList from "./FriendsList";
import FriendsLoading from "./FriendsLoading";
import FriendsEmptyState from "./FriendsEmptyState";

interface RecentFriendsProps {
  currentUserId: string;
  onSelectChat: (chatId: string) => void;
}

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const RecentFriends = ({ currentUserId, onSelectChat }: RecentFriendsProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
    }
  }, [currentUserId]);

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      
      // Get accepted friend requests where the current user is either sender or receiver
      const { data: friendRequests, error: friendRequestsError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
        
      if (friendRequestsError) {
        throw friendRequestsError;
      }
      
      if (friendRequests && friendRequests.length > 0) {
        // Extract friend IDs (the other person in each friend request)
        const friendIds = friendRequests.map(fr => 
          fr.sender_id === currentUserId ? fr.receiver_id : fr.sender_id
        );
        
        // Get user details for these friends
        const { data: friendsData, error: friendsError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', friendIds)
          .order('full_name');
          
        if (friendsError) {
          throw friendsError;
        }
        
        setFriends(friendsData || []);
      } else {
        setFriends([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
      setIsLoading(false);
    }
  };

  const handleFriendClick = async (friendId: string) => {
    try {
      // Check if chat already exists between these users
      const { data: currentUserChats, error: currentUserError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);
        
      if (currentUserError) throw currentUserError;
      
      if (currentUserChats && currentUserChats.length > 0) {
        const chatIds = currentUserChats.map(p => p.chat_id);
        
        const { data: sharedChats, error: sharedChatsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', friendId)
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
            onSelectChat(chatDetails.id);
            return;
          }
        }
      }
      
      // If no chat exists, create one using the edge function
      const result = await createNewChat('direct', null, [friendId], currentUserId);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.chatId) {
        // Select the new chat
        onSelectChat(result.chatId);
      } else {
        throw new Error("Failed to create chat");
      }
    } catch (error: any) {
      console.error("Error handling friend click:", error);
      toast.error("Failed to open chat: " + error.message);
    }
  };

  if (isLoading) {
    return <FriendsLoading />;
  }

  if (friends.length === 0) {
    return <FriendsEmptyState />;
  }

  return <FriendsList friends={friends} onFriendClick={handleFriendClick} />;
};

export default RecentFriends;
