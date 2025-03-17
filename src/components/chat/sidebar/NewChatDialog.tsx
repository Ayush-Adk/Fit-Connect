
import { useState, useEffect } from "react";
import { Plus, UserPlus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface NewChatDialogProps {
  currentUserId: string;
  chats: Array<{
    id: string;
    type: string;
    name: string | null;
    created_at: string;
    updated_at: string;
    participants: {
      user_id: string;
      users: {
        full_name: string;
        avatar_url: string | null;
      };
    }[];
  }>;
  onSelectChat: (chatId: string) => void;
}

const NewChatDialog = ({ currentUserId, chats, onSelectChat }: NewChatDialogProps) => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isNewChatOpen) {
      loadFriends();
    }
  }, [isNewChatOpen]);
  
  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      // Get all accepted friend requests where the current user is either sender or receiver
      const { data: friendRequests, error } = await supabase
        .from('friend_requests')
        .select(`
          sender_id,
          receiver_id
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
        
      if (error) throw error;
      
      // Process friend requests to get a list of friends
      const friendsList: Friend[] = [];
      
      if (friendRequests && friendRequests.length > 0) {
        // Extract friend IDs (the other user in each friendship)
        const friendIds = friendRequests.map(request => 
          request.sender_id === currentUserId ? request.receiver_id : request.sender_id
        );
        
        // Get friend details
        const { data: friendsData, error: friendsError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', friendIds);
          
        if (friendsError) throw friendsError;
        
        if (friendsData) {
          setFriends(friendsData);
        }
      } else {
        setFriends([]);
      }
    } catch (error: any) {
      console.error("Error loading friends:", error.message);
      toast.error("Couldn't load your friends");
    } finally {
      setLoadingFriends(false);
    }
  };
  
  const createNewChat = async () => {
    if (!selectedFriend) {
      toast.error("Please select a friend to chat with");
      return;
    }
    
    setIsCreatingChat(true);
    
    try {
      // Check if a direct chat already exists between these users
      const existingChat = chats.find(chat => {
        if (chat.type !== 'direct') return false;
        
        // Check if both users are participants
        const participantIds = chat.participants.map(p => p.user_id);
        return participantIds.includes(currentUserId) && 
               participantIds.includes(selectedFriend) &&
               participantIds.length === 2;
      });
      
      // Get friend name for notifications
      const { data: friendData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', selectedFriend)
        .single();
      
      const friendName = friendData?.full_name || 'friend';
      
      if (existingChat) {
        setIsNewChatOpen(false);
        
        // Navigate to existing chat
        onSelectChat(existingChat.id);
        navigate(`/messages?chat=${existingChat.id}`);
        
        toast.success(`Chat with ${friendName} opened`);
        return;
      }
      
      // Create a new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (!newChat) {
        throw new Error("Failed to create chat");
      }
      
      // Add participants to the chat
      const participants = [
        { chat_id: newChat.id, user_id: currentUserId },
        { chat_id: newChat.id, user_id: selectedFriend }
      ];
      
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);
      
      if (participantError) throw participantError;
      
      // Create welcome notification for both users
      await supabase.from('notifications').insert([
        {
          user_id: currentUserId,
          type: 'chat_created',
          content: `Chat with ${friendName} started`,
          related_id: selectedFriend
        },
        {
          user_id: selectedFriend,
          type: 'chat_created',
          content: 'A new chat has been started with you',
          related_id: currentUserId
        }
      ]);
      
      toast.success("Chat created successfully");
      setIsNewChatOpen(false);
      
      // Navigate to the new chat
      onSelectChat(newChat.id);
      setTimeout(() => {
        navigate(`/messages?chat=${newChat.id}`);
      }, 100);
      
    } catch (error: any) {
      console.error("Error creating chat:", error.message);
      toast.error("Failed to create chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
          <DialogDescription>
            Select a friend to start chatting with.
          </DialogDescription>
        </DialogHeader>
        
        {loadingFriends ? (
          <div className="text-center py-4">Loading your friends...</div>
        ) : friends.length > 0 ? (
          <Select onValueChange={setSelectedFriend}>
            <SelectTrigger>
              <SelectValue placeholder="Select a friend" />
            </SelectTrigger>
            <SelectContent>
              {friends.map(friend => (
                <SelectItem key={friend.id} value={friend.id}>
                  <div className="flex items-center gap-2">
                    {friend.full_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-center py-4 space-y-2">
            <p>You don't have any friends yet.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setIsNewChatOpen(false);
                setTimeout(() => {
                  navigate('/friends?tab=add');
                }, 100);
              }}
              className="flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add friends first
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => setIsNewChatOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={createNewChat} 
            disabled={!selectedFriend || loadingFriends || isCreatingChat}
          >
            {isCreatingChat ? "Creating..." : "Create Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
