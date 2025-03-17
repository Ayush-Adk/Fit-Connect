
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, UserMinus, Search, Clock, CircleDot, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string | null;
  status: string | null;
  chat_id: string | null;
}

const FriendsList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDeletingFriend, setIsDeletingFriend] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFriends();
    const cleanupSubscription = subscribeToUserPresence();
    return () => {
      cleanupSubscription();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter((friend) =>
          friend.full_name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, friends]);

  const subscribeToUserPresence = () => {
    // Fix for the TypeScript error with postgres_changes
    const presenceChannel = supabase.channel('online-users');
    
    // Use channel subscriptions with the proper event type
    presenceChannel.on(
      'presence',
      { event: 'sync' },
      () => {
        loadFriends();
      }
    ).subscribe();

    // Also listen for database changes using a separate subscription
    const dbChangesChannel = supabase.channel('db-changes');
    
    dbChangesChannel.on(
      'broadcast',
      { event: 'user-status-changed' },
      () => {
        loadFriends();
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(dbChangesChannel);
    };
  };

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted friend requests where current user is either sender or receiver
      const { data: friendRequests, error: requestsError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (requestsError) throw requestsError;
      
      if (!friendRequests || friendRequests.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Extract friend IDs (the other user in each friendship)
      const friendIds = friendRequests.map(request => 
        request.sender_id === user.id ? request.receiver_id : request.sender_id
      );

      // Get friend details
      const { data: friendData, error: friendsError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, last_seen, status')
        .in('id', friendIds);

      if (friendsError) throw friendsError;
      
      // Fix the chat query to use proper syntax
      const friendsWithChats = await Promise.all(
        (friendData || []).map(async (friend) => {
          // Find chats where both users are participants
          const { data: chatParticipants } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', friend.id);
            
          const userChatIds = chatParticipants?.map(p => p.chat_id) || [];
          
          if (userChatIds.length === 0) {
            return {
              ...friend,
              chat_id: null
            };
          }
          
          const { data: commonChats } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', user.id)
            .in('chat_id', userChatIds)
            .limit(1);
            
          return {
            ...friend,
            chat_id: commonChats && commonChats.length > 0 ? commonChats[0].chat_id : null
          };
        })
      );
      
      setFriends(friendsWithChats);
      setFilteredFriends(friendsWithChats);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string, friendName: string) => {
    try {
      setIsDeletingFriend(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find and delete the friend request
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Create notification for the other user
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'friend_removed',
          content: 'removed you from their friends list',
          related_id: user.id
        });
      
      toast.success(`${friendName} has been removed from your friends`);
      loadFriends();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeletingFriend(false);
      setShowConfirmDialog(false);
      setFriendToDelete(null);
    }
  };

  const confirmRemoveFriend = (friend: Friend) => {
    setFriendToDelete(friend);
    setShowConfirmDialog(true);
  };

  const openChat = async (friendId: string, friendName: string, existingChatId?: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let chatId = existingChatId;
      
      // If no existing chat, create a new one
      if (!chatId) {
        try {
          // Create a new chat using the edge function
          console.info("Creating new chat with friend");
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/chat-ai/create-chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              type: 'direct',
              name: null,
              participants: [user.id, friendId]
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to create chat');
          }
          
          const result = await response.json();
          chatId = result.id;
          
          // Send a friendly first message
          await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              sender_id: user.id,
              content: `Hi ${friendName}! Let's chat.`,
              read_by: [user.id]
            });
            
          // Update last message
          await supabase
            .from('chats')
            .update({
              last_message: `Hi ${friendName}! Let's chat.`,
              last_message_at: new Date().toISOString()
            })
            .eq('id', chatId);
        } catch (error) {
          console.error("Error creating chat:", error);
          toast.error("Failed to create chat");
          return;
        }
      }
      
      // Navigate to messages with this specific chat selected
      navigate(`/messages?chat=${chatId}`);
    } catch (error: any) {
      toast.error("Failed to open chat");
      console.error(error);
    }
  };

  const getOnlineStatus = (friend: Friend) => {
    if (friend.status === 'online') {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <CircleDot className="w-3 h-3 mr-1" /> Online
        </span>
      );
    } else {
      const lastSeen = friend.last_seen 
        ? new Date(friend.last_seen)
        : null;
      
      return (
        <span className="flex items-center text-gray-500 text-sm">
          <Clock className="w-3 h-3 mr-1" /> 
          {lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
        </span>
      );
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-4">Loading friends...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center border rounded-md pl-3 mb-6">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="space-y-4">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={friend.avatar_url || ""} alt={friend.full_name} />
                  <AvatarFallback>{friend.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{friend.full_name}</p>
                  {getOnlineStatus(friend)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => openChat(friend.id, friend.full_name, friend.chat_id)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => confirmRemoveFriend(friend)}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No friends found</p>
            <p className="text-sm text-gray-400 mt-2">
              Start by adding friends using the "Add Friend" tab
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Friend
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {friendToDelete?.full_name} from your friends list? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => friendToDelete && removeFriend(friendToDelete.id, friendToDelete.full_name)}
              disabled={isDeletingFriend}
            >
              {isDeletingFriend ? "Removing..." : "Remove Friend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FriendsList;
