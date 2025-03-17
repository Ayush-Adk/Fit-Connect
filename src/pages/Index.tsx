
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import HomeFeed from "@/components/home/HomeFeed";
import SuggestedFriends from "@/components/home/SuggestedFriends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Bell, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UserStats from "@/components/profile/UserStats";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          setUser(userData);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - only show on desktop */}
        <div className="hidden lg:block">
          <div className="space-y-6 sticky top-24">
            {user ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link to="/messages" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        <span>Messages</span>
                      </Link>
                      <Link to="/friends" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors">
                        <Users className="w-5 h-5 text-green-500" />
                        <span>Friends</span>
                      </Link>
                      <Link to="/notifications" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors">
                        <Bell className="w-5 h-5 text-amber-500" />
                        <span>Notifications</span>
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors">
                        <Cog className="w-5 h-5 text-gray-500" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                {/* User Stats */}
                <UserStats userId={user.id} />
              </>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Welcome to FitConnect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-gray-600">
                    Join our community to connect with friends and track your fitness journey together.
                  </p>
                  <div className="flex gap-2">
                    <Link to="/auth" className="w-full">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {user && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Upcoming Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">
                    Join fitness challenges with friends to stay motivated.
                  </p>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3">
                      <h4 className="font-medium">10K Steps Challenge</h4>
                      <p className="text-sm text-gray-500">Starts in 3 days</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <h4 className="font-medium">Morning Workout Club</h4>
                      <p className="text-sm text-gray-500">Ongoing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-2">
          {!user ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4">Welcome to FitConnect</h1>
                  <p className="text-xl text-gray-600 mb-6">
                    Connect with friends, track your fitness journey, and achieve your goals together
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/auth">
                      <Button size="lg">Get Started</Button>
                    </Link>
                    <Button variant="outline" size="lg">Learn More</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          <HomeFeed />
        </div>
        
        {/* Right sidebar - only show when logged in and on desktop */}
        {user && (
          <div className="hidden lg:block">
            <div className="space-y-6 sticky top-24">
              <SuggestedFriends />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">John and Sarah</span> became friends
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-2 mt-1">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Fitness Group</span> has 5 new messages
                        </p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
