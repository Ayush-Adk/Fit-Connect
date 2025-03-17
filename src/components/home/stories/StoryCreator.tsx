import { useState, useRef } from "react";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image, X, Upload, Loader2 } from "lucide-react";

interface StoryCreatorProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUser: {id: string, full_name: string, avatar_url?: string} | null;
  onStoryCreated: () => void;
}

const StoryCreator = ({ 
  isOpen, 
  setIsOpen, 
  currentUser,
  onStoryCreated
}: StoryCreatorProps) => {
  const [storyCaption, setStoryCaption] = useState("");
  const [storyImage, setStoryImage] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      setStoryImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setStoryPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadStory = async () => {
    if (!storyPreview || !currentUser) {
      toast.error("Please select an image for your story");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // Use the edge function to upload the story instead of direct storage access
      // First convert the file to base64
      const base64Data = storyPreview;
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          action: 'uploadStory',
          data: {
            imageData: base64Data,
            caption: storyCaption.trim().length > 0 ? storyCaption : null,
            userId: currentUser.id
          }
        }
      });
      
      if (error) {
        console.error("Error uploading story through function:", error);
        throw error;
      }
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show success toast
      toast.success("Story shared successfully!");
      
      // Notify friends about the new story
      const { data: friendRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      
      if (friendRequests) {
        const friendIds = friendRequests.map(req => 
          req.sender_id === currentUser.id ? req.receiver_id : req.sender_id
        );
        
        // Create notifications for friends
        const notifications = friendIds.map(friendId => ({
          user_id: friendId,
          type: 'new_story',
          content: `${currentUser.full_name} added a new story`,
          related_id: data.story.id
        }));
        
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
      
      // Close the dialog after a brief delay to show 100% completion
      setTimeout(() => {
        setIsOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
        setStoryPreview(null);
        setStoryImage(null);
        setStoryCaption("");
        
        // Refresh stories
        onStoryCreated();
        
        toast("Your story is now visible to your friends", {
          description: "Your story will be visible for 24 hours",
        });
      }, 500);
      
    } catch (error: any) {
      console.error("Error uploading story:", error);
      toast.error("Failed to upload story: " + error.message);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
          <DialogDescription>
            Share a photo that will disappear after 24 hours.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {storyPreview ? (
            <div className="relative">
              <img 
                src={storyPreview} 
                alt="Preview" 
                className="w-full h-60 object-cover rounded-md" 
              />
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2 rounded-full p-1 h-8 w-8"
                onClick={() => {
                  setStoryPreview(null);
                  setStoryImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center">
                <Image className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload an image</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG or GIF (max. 5MB)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="caption">Add a caption (optional)</Label>
            <input
              id="caption"
              type="text"
              placeholder="What's on your mind?"
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadStory} 
              disabled={!storyPreview || isUploading}
              className="relative"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Share Story
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryCreator;
