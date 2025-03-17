
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FriendCardProps {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  onClick: (friendId: string) => void;
}

const FriendCard = ({ id, fullName, avatarUrl, onClick }: FriendCardProps) => {
  return (
    <Button
      key={id}
      variant="ghost"
      className="flex flex-col items-center p-2 h-auto"
      onClick={() => onClick(id)}
    >
      <Avatar className="h-10 w-10 mb-1">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={fullName} />
        ) : (
          <AvatarFallback>
            {fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-xs line-clamp-1">{fullName}</span>
    </Button>
  );
};

export default FriendCard;
