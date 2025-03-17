
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface UserStatsProps {
  userId: string;
}

const UserStats = ({ userId }: UserStatsProps) => {
  const [friendCount, setFriendCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [storiesCount, setStoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      // Count friends (accepted friend requests)
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', userId)
        .eq('status', 'accepted');
        
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('receiver_id', userId)
        .eq('status', 'accepted');
        
      if (sentError || receivedError) throw sentError || receivedError;
      
      const friendsCount = (sentRequests?.length || 0) + (receivedRequests?.length || 0);
      setFriendCount(friendsCount);
      
      // In a real application, fetch posts and stories counts from their respective tables
      // For this example, we'll use mock data
      setPostsCount(Math.floor(Math.random() * 30));
      setStoriesCount(Math.floor(Math.random() * 10));
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-around text-center">
            <div className="animate-pulse bg-gray-200 h-12 w-16 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 w-16 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 w-16 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-around text-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{friendCount}</span>
            <span className="text-sm text-gray-500">Friends</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{postsCount}</span>
            <span className="text-sm text-gray-500">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{storiesCount}</span>
            <span className="text-sm text-gray-500">Stories</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStats;
