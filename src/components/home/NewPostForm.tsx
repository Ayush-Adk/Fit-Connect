
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Video, Smile, MapPin, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface NewPostFormProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  onSubmit: (content: string, imageUrl?: string) => void;
}

const EMOJI_LIST = [
  "😊", "😂", "❤️", "👍", "🎉", "🔥", "👋", "✨", "👏", "🙏",
  "😎", "🤔", "😢", "😍", "👌", "🥳", "🚀", "💯", "🙌", "🤗"
];

const NewPostForm = ({ user, onSubmit }: NewPostFormProps) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) {
      toast.error("Please add some content to your post");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image to Supabase Storage if one is selected
      let finalImageUrl = imageUrl;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Upload the file to Supabase
        setIsUploading(true);
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
          
        finalImageUrl = data.publicUrl;
        setIsUploading(false);
      }
      
      // Save post to database
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: content,
          image_url: finalImageUrl,
        })
        .select()
        .single();
      
      if (postError) throw postError;
      
      // Notify friends about the new post
      const { data: friendRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (friendRequests) {
        const friendIds = friendRequests.map(req => 
          req.sender_id === user.id ? req.receiver_id : req.sender_id
        );
        
        // Create notifications for friends
        const notifications = friendIds.map(friendId => ({
          user_id: friendId,
          type: 'new_post',
          content: `${user.name} shared a new post`,
          related_id: post.id
        }));
        
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
      
      // Call the onSubmit handler
      onSubmit(content, finalImageUrl);
      
      // Reset form
      setContent("");
      setImageUrl("");
      setImageFile(null);
      setLocation("");
      
      toast.success("Post created successfully!");
    } catch (error: any) {
      console.error("Error submitting post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle location selection
  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude},${longitude}`);
          toast.success("Location added to post");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{user.name}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <Textarea
          placeholder="What's on your mind?"
          className="w-full resize-none mb-3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />

        {imageUrl && (
          <div className="relative mb-3 rounded-md overflow-hidden">
            <img src={imageUrl} alt="Preview" className="w-full max-h-60 object-cover" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setImageUrl("");
                setImageFile(null);
              }}
              type="button"
            >
              Remove
            </Button>
          </div>
        )}

        {location && (
          <div className="text-sm text-gray-500 mb-3">
            <MapPin className="inline-block h-4 w-4 mr-1" />
            Location added
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setLocation("")}
              type="button"
            >
              Remove
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button type="button" variant="outline" size="sm">
                <Image className="h-4 w-4 mr-1" />
                Photo
              </Button>
            </label>

            <Button type="button" variant="outline" size="sm">
              <Video className="h-4 w-4 mr-1" />
              Video
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Smile className="h-4 w-4 mr-1" />
                  Emoji
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-xl p-2 hover:bg-gray-100 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleLocationClick}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isUploading || (!content.trim() && !imageUrl)}
          >
            {(isSubmitting || isUploading) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Posting..."}
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewPostForm;
