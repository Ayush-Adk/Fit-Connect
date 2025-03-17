
import { ScrollArea } from "@/components/ui/scroll-area";
import StoryCircle from "../StoryCircle";
import { Plus, Loader2 } from "lucide-react";

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

interface UserStory {
  user: Story['user'];
  hasUnseenStory: boolean;
  stories: Story[];
}

interface StoryCircleListProps {
  userStories: Record<string, UserStory>;
  onStoryClick: (story: Story) => void;
  onAddStoryClick: () => void;
  isLoading?: boolean;
}

const StoryCircleList = ({ 
  userStories, 
  onStoryClick, 
  onAddStoryClick,
  isLoading = false
}: StoryCircleListProps) => {
  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex space-x-4 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center w-full py-4">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Add Story Button */}
            <div className="flex flex-col items-center space-y-1" onClick={onAddStoryClick}>
              <div className="relative hover-scale">
                <div className="bg-gray-200 rounded-full p-0.5">
                  <div className="h-16 w-16 border-2 border-white bg-white rounded-full flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  +
                </div>
              </div>
              <span className="text-xs truncate max-w-[70px] text-center">Add Story</span>
            </div>

            {/* User Stories */}
            {Object.values(userStories).map(({ user, hasUnseenStory, stories }) => (
              <StoryCircle
                key={user.id}
                id={user.id}
                name={user.name}
                imageUrl={user.avatar}
                hasUnseenStory={hasUnseenStory}
                onClick={() => onStoryClick(stories[0])}
              />
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  );
};

export default StoryCircleList;
