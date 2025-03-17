import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, CheckCircle, XCircle, Search, Mail, AtSign } from "lucide-react";

interface FoundUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  username?: string;
}

const AddFriend = () => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchMode, setSearchMode] = useState<'email' | 'username'>('email');
  
  useEffect(() => {
    checkAuth();
    loadPendingRequests();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get sent friend requests
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('receiver_id, status')
        .eq('sender_id', user.id);

      if (error) throw error;

      // Create a map of user_id -> isPending
      const pendingMap: Record<string, boolean> = {};
      
      if (requests) {
        requests.forEach(request => {
          pendingMap[request.receiver_id] = request.status === 'pending';
        });
      }
      
      setPendingRequests(pendingMap);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      setIsSearching(true);
      setFoundUsers([]);

      // Get current user to exclude from results
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query;
      
      if (searchMode === 'email') {
        // Search by email (exact match or partial)
        query = supabase
          .from('users')
          .select('id, full_name, email, avatar_url, username')
          .neq('id', user.id)
          .ilike('email', `%${searchInput}%`);
      } else {
        // Search by username
        query = supabase
          .from('users')
          .select('id, full_name, email, avatar_url, username')
          .neq('id', user.id)
          .ilike('username', `%${searchInput}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Only show users that aren't already friends
      if (data && data.length > 0) {
        // Get existing friendships (both directions)
        const { data: existingFriends, error: friendsError } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'accepted');
          
        if (friendsError) throw friendsError;
        
        // Filter out users who are already friends
        let filteredUsers = data;
        
        if (existingFriends && existingFriends.length > 0) {
          const friendIds = new Set<string>();
          
          existingFriends.forEach(friendship => {
            if (friendship.sender_id === user.id) {
              friendIds.add(friendship.receiver_id);
            } else if (friendship.receiver_id === user.id) {
              friendIds.add(friendship.sender_id);
            }
          });
          
          filteredUsers = data.filter(foundUser => !friendIds.has(foundUser.id));
        }
        
        setFoundUsers(filteredUsers);
      } else {
        toast.info("No users found");
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string, userName: string) => {
    try {
      setIsSubmitting(true);
      
      // Check if a request already exists between these users
      const { data: existingRequests, error: checkError } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`);
        
      if (checkError) throw checkError;
      
      // If there's a pending request from this user to us, let's accept it
      if (existingRequests && existingRequests.length > 0) {
        const incomingRequest = existingRequests.find(
          req => req.status === 'pending'
        );
        
        if (incomingRequest) {
          const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', incomingRequest.id);
            
          if (updateError) throw updateError;
          
          // Create notification for the other user
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'friend_request_accepted',
            content: 'accepted your friend request',
            related_id: currentUserId
          });
          
          toast.success(`Friend request from ${userName} accepted!`);
          setPendingRequests(prev => ({ ...prev, [userId]: false }));
          return;
        }
        
        // If we already sent a request or are already friends
        const existingRequest = existingRequests[0];
        if (existingRequest.status === 'pending') {
          toast.info(`Friend request to ${userName} already sent`);
          return;
        } else if (existingRequest.status === 'accepted') {
          toast.info(`You are already friends with ${userName}`);
          return;
        }
      }
      
      // Otherwise, send a new friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      
      // Create notification for the other user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'friend_request',
        content: 'sent you a friend request',
        related_id: currentUserId
      });

      toast.success(`Friend request sent to ${userName}`);
      setPendingRequests(prev => ({ ...prev, [userId]: true }));
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error(`Failed to send request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Friends</CardTitle>
        <CardDescription>
          Search users by email or username and connect with them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" onValueChange={(value) => setSearchMode(value as 'email' | 'username')}>
          <TabsList className="mb-4">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" /> 
              Search by Email
            </TabsTrigger>
            <TabsTrigger value="username">
              <AtSign className="h-4 w-4 mr-2" /> 
              Search by Username
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter email address"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button disabled={isSearching || !searchInput.trim()}>
                {isSearching ? "Searching..." : "Search"}
                <Search className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="username">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter username"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button disabled={isSearching || !searchInput.trim()}>
                {isSearching ? "Searching..." : "Search"}
                <Search className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {foundUsers.length > 0 ? (
          <div className="space-y-4">
            {foundUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{user.full_name}</h4>
                    <div className="text-sm text-muted-foreground flex flex-col">
                      <span>{user.email}</span>
                      {user.username && <span className="text-xs">@{user.username}</span>}
                    </div>
                  </div>
                </div>
                <Button
                  variant={pendingRequests[user.id] ? "secondary" : "default"}
                  size="sm"
                  onClick={() => sendFriendRequest(user.id, user.full_name)}
                  disabled={isSubmitting}
                >
                  {pendingRequests[user.id] ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Pending
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : isSearching ? (
          <div className="py-8 text-center">Searching...</div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Search for friends to connect with.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddFriend;
