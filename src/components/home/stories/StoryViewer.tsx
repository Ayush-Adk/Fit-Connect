
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StoryCircle from "../StoryCircle";
import { createNewChat } from "@/components/chat/sidebar/CreateChatUtils";

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

interface StoryViewerProps {
  story: Story | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUserId: string;
  currentUser: {id: string, full_name: string, avatar_url?: string} | null;
  onCommentSubmitted?: () => void;
}

const StoryViewer = ({ 
  story, 
  isOpen, 
  setIsOpen, 
  currentUserId,
  currentUser,
  onCommentSubmitted
}: StoryViewerProps) => {
  const [storyReplyText, setStoryReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [storyComments, setStoryComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (isOpen && story) {
      loadStoryComments();
    }
  }, [isOpen, story]);

  const loadStoryComments = async () => {
    if (!story) return;
    
    try {
      setIsLoadingComments(true);
      
      const { data, error } = await supabase
        .from('story_comments')
        .select('*, user:user_id(id, full_name, avatar_url)')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setStoryComments(data || []);
    } catch (error) {
      console.error("Error loading story comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendStoryReply = async () => {
    if (!storyReplyText.trim() || !story || !currentUser) return;
    
    setIsSendingReply(true);
    try {
      // Send as a direct message
      if (story.user.id !== currentUserId) {
        // Create a direct chat or use existing one
        const { chatId, error } = await createNewChat(
          'direct',
          null,
          [story.user.id],
          currentUserId
        );
        
        if (error) throw error;
        
        // Add message to the chat
        if (chatId) {
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              sender_id: currentUserId,
              content: `Reply to story: ${storyReplyText}`,
              read_by: [currentUserId]
            });
            
          if (messageError) throw messageError;
            
          // Update last message
          await supabase
            .from('chats')
            .update({
              last_message: `Reply to story: ${storyReplyText}`,
              last_message_at: new Date().toISOString()
            })
            .eq('id', chatId);
            
          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: story.user.id,
              type: 'story_reply',
              content: 'replied to your story',
              related_id: currentUserId
            });
        }
      }
      
      // Also save as a comment
      const { error: commentError } = await supabase
        .from('story_comments')
        .insert({
          story_id: story.id,
          user_id: currentUserId,
          content: storyReplyText
        });
        
      if (commentError) throw commentError;
      
      toast.success("Comment added!");
      setStoryReplyText("");
      
      // Refresh comments
      loadStoryComments();
      
      // Notify parent component
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (error: any) {
      console.error("Error sending story reply:", error);
      toast.error("Failed to send reply: " + error.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!story) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-2">
              <StoryCircle 
                id={story.user.id}
                name={story.user.name}
                imageUrl={story.user.avatar}
                hasUnseenStory={false}
                size="sm"
              />
              <span className="text-white font-medium">{story.user.name}</span>
            </div>
            <span className="text-xs text-white">
              {new Date(story.timestamp).toLocaleString()}
            </span>
          </div>
          <img 
            src={story.imageUrl || "/placeholder.svg"} 
            alt="Story" 
            className="w-full h-[70vh] object-cover" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
              toast.error("Failed to load story image");
            }}
          />
          
          {/* Story footer with reactions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            {story.caption && (
              <p className="text-white mb-3">{story.caption}</p>
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white">
                  ❤️
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  👍
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  😮
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {storyComments.length > 0 ? storyComments.length : "Comments"}
              </Button>
            </div>
            
            {/* Comments section */}
            {showComments && (
              <div className="mt-3 bg-black/30 rounded p-2 max-h-32 overflow-y-auto">
                {isLoadingComments ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                ) : storyComments.length > 0 ? (
                  storyComments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                        {comment.user?.avatar_url ? (
                          <img src={comment.user.avatar_url} alt={comment.user.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-xs text-primary-foreground font-bold">
                            {comment.user?.full_name?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                        )}
                      </div>
                      <div className="bg-black/20 p-2 rounded text-white text-sm flex-1">
                        <p className="font-bold text-xs">{comment.user?.full_name}</p>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/70 text-sm text-center">No comments yet</p>
                )}
              </div>
            )}
            
            {/* Reply input */}
            <div className="mt-3 flex gap-2">
              <Input
                value={storyReplyText}
                onChange={(e) => setStoryReplyText(e.target.value)}
                placeholder="Reply to story..."
                className="bg-white/20 text-white placeholder:text-white/60 border-white/30"
              />
              <Button 
                onClick={handleSendStoryReply} 
                disabled={!storyReplyText.trim() || isSendingReply}
                size="sm"
              >
                {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewer;
