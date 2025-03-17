
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoryCircleProps {
  id: string;
  name: string;
  imageUrl?: string;
  hasUnseenStory?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const StoryCircle = ({ 
  id, 
  name, 
  imageUrl, 
  hasUnseenStory = false, 
  onClick,
  size = "md"
}: StoryCircleProps) => {
  // Size mapping for avatar and border
  const sizeMap = {
    sm: {
      avatar: "h-8 w-8",
      border: "p-0.5",
      nameClass: "text-xs max-w-[40px]"
    },
    md: {
      avatar: "h-16 w-16",
      border: "p-0.5",
      nameClass: "text-xs max-w-[70px]"
    },
    lg: {
      avatar: "h-20 w-20",
      border: "p-1",
      nameClass: "text-sm max-w-[90px]"
    }
  };

  const { avatar, border, nameClass } = sizeMap[size];

  return (
    <div 
      className="flex flex-col items-center space-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div 
        className={cn(
          "rounded-full",
          border,
          hasUnseenStory 
            ? "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" 
            : "bg-gray-200",
          "hover:scale-105 transition-transform duration-200"
        )}
      >
        <Avatar className={cn("border-2 border-white", avatar)}>
          <AvatarImage src={imageUrl} />
          <AvatarFallback className="bg-primary/10">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      {size !== "sm" && (
        <span className={cn("truncate text-center", nameClass)}>{name}</span>
      )}
    </div>
  );
};

export default StoryCircle;
