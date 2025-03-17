
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface UserSuggestion {
  id: string;
  full_name: string;
  avatar_url: string | null;
  mutual_friends: number;
}

const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the user's current friends
      const { data: friendRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      if (!friendRequests || friendRequests.length === 0) {
        // If no friends, just show some random users
        const { data: randomUsers } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .neq('id', user.id)
          .limit(5);
        
        setSuggestions(
          (randomUsers || []).map(u => ({
            ...u,
            mutual_friends: 0
          }))
        );
        setLoading(false);
        return;
      }

      // Extract friend IDs
      const friendIds = friendRequests.map(request => 
        request.sender_id === user.id ? request.receiver_id : request.sender_id
      );

      // Get friends of friends
      const friendsOfFriends: Record<string, number> = {};
      
      for (const friendId of friendIds) {
        const { data: friendsOfFriend } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
          .eq('status', 'accepted');
        
        if (friendsOfFriend && friendsOfFriend.length > 0) {
          friendsOfFriend.forEach(f => {
            const suggestedUserId = f.sender_id === friendId ? f.receiver_id : f.sender_id;
            
            // Don't suggest users who are already friends or the current user
            if (suggestedUserId !== user.id && !friendIds.includes(suggestedUserId)) {
              friendsOfFriends[suggestedUserId] = (friendsOfFriends[suggestedUserId] || 0) + 1;
            }
          });
        }
      }

      // Get details of suggested users
      const suggestedUserIds = Object.keys(friendsOfFriends);
      
      if (suggestedUserIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', suggestedUserIds);
      
      // Also check for pending requests to these users
      const { data: pendingRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`and(sender_id.eq.${user.id},receiver_id.in.(${suggestedUserIds.join(',')})),and(sender_id.in.(${suggestedUserIds.join(',')}),receiver_id.eq.${user.id})`)
        .eq('status', 'pending');
      
      const pendingUserIds = new Set();
      if (pendingRequests) {
        pendingRequests.forEach(req => {
          if (req.sender_id === user.id) {
            pendingUserIds.add(req.receiver_id);
          } else {
            pendingUserIds.add(req.sender_id);
          }
        });
      }
      
      // Format the suggestions, excluding those with pending requests
      const formattedSuggestions = (userDetails || [])
        .filter(u => !pendingUserIds.has(u.id))
        .map(u => ({
          ...u,
          mutual_friends: friendsOfFriends[u.id]
        }))
        .sort((a, b) => b.mutual_friends - a.mutual_friends)
        .slice(0, 5);
      
      setSuggestions(formattedSuggestions);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load friend suggestions");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string, userName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success(`Friend request sent to ${userName}!`);
      
      // Remove the user from suggestions
      setSuggestions(suggestions.filter(s => s.id !== userId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading suggestions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Friend Suggestions</h2>
        <p className="text-gray-500 mb-4">
          People you might know based on mutual connections
        </p>
      </div>
      
      <div className="space-y-4">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={suggestion.avatar_url || ""} alt={suggestion.full_name} />
                  <AvatarFallback>{suggestion.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{suggestion.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {suggestion.mutual_friends} mutual {suggestion.mutual_friends === 1 ? 'friend' : 'friends'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => sendFriendRequest(suggestion.id, suggestion.full_name)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No suggestions available</p>
            <p className="text-sm text-gray-400 mt-2">
              Try adding more friends to see suggestions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendSuggestions;
