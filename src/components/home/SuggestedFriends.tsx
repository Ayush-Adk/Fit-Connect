
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface SuggestedFriend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const SuggestedFriends = () => {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, this would query users not yet connected with the current user
      // For demo purposes, we'll just get a random set of users excluding the current user
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .neq('id', user.id)
        .limit(5);

      if (error) throw error;
      
      // In a real app, we would filter out existing friends and pending requests
      setSuggestions(data || []);
    } catch (error: any) {
      console.error("Error loading friend suggestions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      setSendingRequests(prev => ({ ...prev, [friendId]: true }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to send friend requests");
        return;
      }

      // Check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRequest) {
        toast.info("A friend request already exists between you and this user");
        return;
      }

      // Send the friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          status: 'pending'
        });

      if (error) throw error;
      
      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'friend_request',
          content: 'sent you a friend request',
          related_id: user.id
        });

      toast.success("Friend request sent!");
      
      // Remove the suggested friend from the list
      setSuggestions(prev => prev.filter(s => s.id !== friendId));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSendingRequests(prev => ({ ...prev, [friendId]: false }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggested Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">Loading suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Suggested Friends</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.avatar_url || ""} />
                    <AvatarFallback>{friend.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{friend.full_name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => sendFriendRequest(friend.id)}
                  disabled={sendingRequests[friend.id]}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">
            No suggestions available at the moment
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedFriends;
