
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FriendRequests } from "@/components/friends/FriendRequests";
import FriendsList from "@/components/friends/FriendsList";
import FriendSuggestions from "@/components/friends/FriendSuggestions";
import AddFriend from "@/components/friends/AddFriend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "react-router-dom";

const Friends = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "list");
  const [hasNewRequests, setHasNewRequests] = useState(false);

  useEffect(() => {
    checkNewRequests();
    subscribeToFriendRequests();
    
    // Update active tab if URL param changes
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const checkNewRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setHasNewRequests(data && data.length > 0);
    } catch (error: any) {
      console.error("Error checking requests:", error.message);
    }
  };

  const subscribeToFriendRequests = () => {
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
          checkNewRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Friends</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-4 mb-8 w-full">
              <TabsTrigger value="list" className="font-medium">My Friends</TabsTrigger>
              <TabsTrigger value="requests" className="relative font-medium">
                Requests
                {hasNewRequests && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    !
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="add" className="font-medium">Add Friend</TabsTrigger>
              <TabsTrigger value="suggestions" className="font-medium">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="animate-in">
              <FriendsList />
            </TabsContent>
            
            <TabsContent value="requests" className="animate-in">
              <FriendRequests onUpdateRequests={checkNewRequests} />
            </TabsContent>
            
            <TabsContent value="add" className="animate-in">
              <AddFriend />
            </TabsContent>
            
            <TabsContent value="suggestions" className="animate-in">
              <FriendSuggestions />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Friends;
