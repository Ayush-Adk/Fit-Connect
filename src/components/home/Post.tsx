
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";

interface PostProps {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  onLikeUpdated?: () => void;
}

const Post = ({
  id,
  author,
  content,
  imageUrl,
  likes,
  comments,
  timestamp,
  isLiked = false,
  onLikeUpdated,
}: PostProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) {
        toast.error("You need to be logged in to like posts");
        return;
      }
      
      if (liked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .match({ user_id: user.id, post_id: id });
          
        if (error) {
          console.error("Error unliking post:", error);
          throw error;
        }
        
        setLikeCount(prev => prev - 1);
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({ user_id: user.id, post_id: id });
          
        if (error) {
          console.error("Error liking post:", error);
          throw error;
        }
        
        setLikeCount(prev => prev + 1);
        
        // Create notification for the post author
        if (author.id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: author.id,
            type: 'post_like',
            content: `liked your post`,
            related_id: id
          });
        }
      }
      
      setLiked(!liked);
      
      // Call the callback to refresh posts if provided
      if (onLikeUpdated) {
        onLikeUpdated();
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) {
        toast.error("You need to be logged in to comment");
        return;
      }

      // Create comment
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: id,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) {
        console.error("Error creating comment:", error);
        throw error;
      }

      // Create notification for post author
      if (author.id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: author.id,
          type: 'post_comment',
          content: newComment.trim(),
          related_id: id
        });
      }

      // Update comment count
      setCommentCount(prev => prev + 1);
      setNewComment("");
      toast.success("Comment added");
      
      // Call the callback to refresh posts if provided
      if (onLikeUpdated) {
        onLikeUpdated();
      }
    } catch (error) {
      console.error("Error commenting on post:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={author.avatar} />
              <AvatarFallback>{author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{author.name}</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Post Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Save Post</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem>Hide</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-0">
        <p className="mb-3">{content}</p>
        {imageUrl && (
          <div className="rounded-md overflow-hidden mb-3">
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 flex flex-col border-t">
        <div className="flex justify-between w-full">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-500 hover:text-primary"
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${
                    liked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              )}
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-500 hover:text-primary"
              onClick={() => setShowCommentInput(!showCommentInput)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-primary"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        
        {showCommentInput && (
          <form onSubmit={submitComment} className="mt-3 w-full">
            <div className="flex items-center gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
                disabled={isSubmittingComment}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </CardFooter>
    </Card>
  );
};

export default Post;
