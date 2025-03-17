
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StoryCircleList from "./StoryCircleList";
import StoryViewer from "./StoryViewer";
import StoryCreator from "./StoryCreator";
import { toast } from "sonner";

interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  imageUrl?: string;
  timestamp: string;
  viewed: boolean;
  caption?: string;
}

interface StoriesRowProps {
  stories: Story[];
  currentUserId: string;
}

const StoriesRow = ({ stories: initialStories, currentUserId }: StoriesRowProps) => {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, full_name: string, avatar_url?: string} | null>(null);
  const [dbStories, setDbStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          if (userData) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Fetch stories that haven't expired yet
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;
      
      if (!storiesData || storiesData.length === 0) {
        setDbStories([]);
        setStories([]);
        setIsLoading(false);
        return;
      }
      
      // Get friends to filter stories
      const { data: friendRequests, error: friendsError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
      if (friendsError) throw friendsError;
      
      // Create a set of friend IDs + current user
      const friendIds = new Set<string>();
      friendIds.add(user.id); // Add current user
      
      if (friendRequests) {
        friendRequests.forEach(req => {
          if (req.sender_id === user.id) {
            friendIds.add(req.receiver_id);
          } else {
            friendIds.add(req.sender_id);
          }
        });
      }
      
      // Filter stories to only show friends and current user
      const friendStories = storiesData.filter(story => 
        friendIds.has(story.user_id)
      );
      
      // Process stories to include user details and view status
      const processedStories = await Promise.all(friendStories.map(async (story) => {
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
        
        // Add user info and views to the story object
        return {
          ...story,
          users: userData,
          story_views: viewsData || []
        };
      }));
      
      // Filter out null values
      const validStories = processedStories.filter(Boolean);
      setDbStories(validStories);
      
      // Format stories for component
      const formattedStories = validStories.map(story => ({
        id: story.id,
        user: {
          id: story.users.id,
          name: story.users.full_name,
          avatar: story.users.avatar_url,
        },
        imageUrl: story.image_url,
        caption: story.caption,
        timestamp: story.created_at,
        viewed: story.story_views.some(view => view.viewer_id === currentUserId)
      }));
      
      setStories(formattedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      toast.error("Failed to load stories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setIsStoryOpen(true);
    
    // Mark story as viewed if it belongs to another user
    if (story.user.id !== currentUserId) {
      // Find the DB story that matches this ID
      const dbStory = dbStories.find(s => s.id === story.id);
      
      if (dbStory) {
        // Check if story has already been viewed
        const alreadyViewed = dbStory.story_views?.some(
          (view: any) => view.viewer_id === currentUserId
        );
        
        if (!alreadyViewed) {
          // Record the view in the database
          supabase
            .from('story_views')
            .insert({
              story_id: story.id,
              viewer_id: currentUserId
            })
            .then(({ error }) => {
              if (error) console.error("Error recording story view:", error);
              else {
                // Create notification for story owner
                if (story.user.id !== currentUserId) {
                  supabase.from('notifications').insert({
                    user_id: story.user.id,
                    type: 'story_view',
                    content: `viewed your story`,
                    related_id: currentUserId
                  });
                }
              }
            });
        }
      }
    }
    
    // Mark story as viewed in the local state
    const updatedStories = stories.map(s => {
      if (s.id === story.id) {
        return { ...s, viewed: true };
      }
      return s;
    });
    
    setStories(updatedStories);
  };

  const handleAddStory = () => {
    setIsAddStoryOpen(true);
  };

  // Group stories by user
  const userStories = stories.reduce((acc, story) => {
    if (!acc[story.user.id]) {
      acc[story.user.id] = {
        user: story.user,
        hasUnseenStory: !story.viewed,
        stories: []
      };
    }
    
    acc[story.user.id].stories.push(story);
    // If any story is unviewed, mark the user as having unseen stories
    if (!story.viewed) {
      acc[story.user.id].hasUnseenStory = true;
    }
    
    return acc;
  }, {} as Record<string, { user: Story['user'], hasUnseenStory: boolean, stories: Story[] }>);

  return (
    <>
      <StoryCircleList 
        userStories={userStories} 
        onStoryClick={handleStoryClick} 
        onAddStoryClick={handleAddStory}
        isLoading={isLoading}
      />
      
      <StoryViewer 
        story={selectedStory} 
        isOpen={isStoryOpen} 
        setIsOpen={setIsStoryOpen} 
        currentUserId={currentUserId}
        currentUser={currentUser}
        onCommentSubmitted={fetchStories}
      />
      
      <StoryCreator 
        isOpen={isAddStoryOpen} 
        setIsOpen={setIsAddStoryOpen} 
        currentUser={currentUser}
        onStoryCreated={fetchStories}
      />
    </>
  );
};

export default StoriesRow;
