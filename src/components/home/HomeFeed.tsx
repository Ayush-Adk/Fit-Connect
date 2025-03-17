
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Post from "./Post";
import NewPostForm from "./NewPostForm";
import StoriesRow from "./StoriesRow";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const HomeFeed = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("for-you");
  const [loading, setLoading] = useState(true);
  const [followingPosts, setFollowingPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          setCurrentUser({
            id: userData.id,
            name: userData.full_name,
            avatar: userData.avatar_url,
          });
        } else {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
    loadPosts();
    loadStories();
    
    // Listen for new posts
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, loadPosts)
      .subscribe();
    
    // Listen for new stories
    const storiesChannel = supabase
      .channel('public:stories')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stories'
      }, loadStories)
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(storiesChannel);
    };
  }, []);

  const loadPosts = async () => {
    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      
      // Get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      if (!postsData) {
        setPosts([]);
        return;
      }
      
      // For each post, get author details
      const processedPosts = await Promise.all(postsData.map(async (post) => {
        // Get author details
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', post.author_id)
          .single();
        
        if (authorError) {
          console.error("Error fetching author:", authorError);
          return null;
        }
        
        // Get likes count
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('id, user_id')
          .eq('post_id', post.id);
        
        if (likesError) {
          console.error("Error fetching likes:", likesError);
          return null;
        }
        
        // Get comments count
        const { data: commentsData, error: commentsError } = await supabase
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id);
        
        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          return null;
        }
        
        return {
          id: post.id,
          author: {
            id: authorData.id,
            name: authorData.full_name,
            avatar: authorData.avatar_url,
          },
          content: post.content,
          imageUrl: post.image_url,
          likes: likesData?.length || 0,
          comments: commentsData?.length || 0,
          timestamp: post.created_at,
          isLiked: likesData?.some(like => like.user_id === currentUserId) || false
        };
      }));
      
      // Filter out null values and set posts
      setPosts(processedPosts.filter(Boolean));
      
      // Now handle following posts if user is logged in
      if (currentUserId) {
        const { data: friendRequests } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
        
        if (friendRequests && friendRequests.length > 0) {
          const friendIds = friendRequests.map(req => 
            req.sender_id === currentUserId ? req.receiver_id : req.sender_id
          );
          
          const { data: friendPosts, error: friendPostsError } = await supabase
            .from('posts')
            .select('*')
            .in('author_id', friendIds)
            .order('created_at', { ascending: false });
            
          if (friendPostsError) throw friendPostsError;
          
          if (!friendPosts) {
            setFollowingPosts([]);
            return;
          }
          
          // Process friend posts similarly to all posts
          const processedFriendPosts = await Promise.all(friendPosts.map(async (post) => {
            // Get author details
            const { data: authorData, error: authorError } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', post.author_id)
              .single();
            
            if (authorError) {
              console.error("Error fetching author:", authorError);
              return null;
            }
            
            // Get likes count
            const { data: likesData, error: likesError } = await supabase
              .from('post_likes')
              .select('id, user_id')
              .eq('post_id', post.id);
            
            if (likesError) {
              console.error("Error fetching likes:", likesError);
              return null;
            }
            
            // Get comments count
            const { data: commentsData, error: commentsError } = await supabase
              .from('post_comments')
              .select('id')
              .eq('post_id', post.id);
            
            if (commentsError) {
              console.error("Error fetching comments:", commentsError);
              return null;
            }
            
            return {
              id: post.id,
              author: {
                id: authorData.id,
                name: authorData.full_name,
                avatar: authorData.avatar_url,
              },
              content: post.content,
              imageUrl: post.image_url,
              likes: likesData?.length || 0,
              comments: commentsData?.length || 0,
              timestamp: post.created_at,
              isLiked: likesData?.some(like => like.user_id === currentUserId) || false
            };
          }));
          
          // Filter out null values and set following posts
          setFollowingPosts(processedFriendPosts.filter(Boolean));
        }
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const loadStories = async () => {
    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      
      // Fetch stories that haven't expired yet
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;
      
      if (!storiesData) {
        setStories([]);
        return;
      }
      
      // Process each story to get user details and view status
      const processedStories = await Promise.all(storiesData.map(async (story) => {
        // Get user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', story.user_id)
          .single();
        
        if (userError) {
          console.error("Error fetching story user:", userError);
          return null;
        }
        
        // Get view status
        const { data: viewsData, error: viewsError } = await supabase
          .from('story_views')
          .select('viewer_id')
          .eq('story_id', story.id);
        
        if (viewsError) {
          console.error("Error fetching story views:", viewsError);
          return null;
        }
        
        // Format story for component
        return {
          id: story.id,
          user: {
            id: userData.id,
            name: userData.full_name,
            avatar: userData.avatar_url,
          },
          imageUrl: story.image_url,
          caption: story.caption,
          timestamp: story.created_at,
          viewed: viewsData?.some(view => view.viewer_id === currentUserId) || false
        };
      }));
      
      // Filter out null values and set stories
      setStories(processedStories.filter(Boolean));
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  };

  const handlePostSubmit = async (content: string, imageUrl?: string) => {
    if (!currentUser) {
      toast.error("You need to be logged in to post");
      return;
    }

    try {
      // Create post in database
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          content,
          image_url: imageUrl
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Refresh posts
      loadPosts();
      
      toast.success("Post created successfully!");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stories section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <StoriesRow stories={stories} currentUserId={currentUser?.id || ""} />
      </div>

      {/* New post form */}
      {currentUser && (
        <NewPostForm
          user={currentUser}
          onSubmit={handlePostSubmit}
        />
      )}

      {/* Feed tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Post 
                key={post.id} 
                {...post} 
                onLikeUpdated={loadPosts}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">
                Be the first to share something with the community!
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          {followingPosts.length > 0 ? (
            followingPosts.map((post) => (
              <Post 
                key={post.id} 
                {...post} 
                onLikeUpdated={loadPosts}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Follow more friends</h3>
              <p className="text-gray-500 mb-4">
                When you follow friends, you'll see their posts here.
              </p>
              <Button onClick={() => window.location.href = '/friends?tab=add'}>Find Friends</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomeFeed;
