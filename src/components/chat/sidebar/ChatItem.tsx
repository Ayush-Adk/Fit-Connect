
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatItemProps {
  chat: {
    id: string;
    type: string;
    name: string | null;
    created_at: string;
    updated_at: string;
    last_message?: string | null;
    participants: {
      user_id: string;
      users: {
        full_name: string;
        avatar_url: string | null;
      };
    }[];
  };
  currentUserId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ChatItem = ({ chat, currentUserId, isSelected, onSelect }: ChatItemProps) => {
  const getChatName = () => {
    if (chat.type === 'group' && chat.name) return chat.name;
    const otherParticipant = chat.participants
      .find(p => p.user_id !== currentUserId)?.users;
    return otherParticipant?.full_name || 'Unknown User';
  };
  
  const getAvatarInfo = () => {
    if (chat.type === 'group') {
      return {
        src: null,
        fallback: chat.name?.substring(0, 2).toUpperCase() || 'GC'
      };
    }
    
    const otherParticipant = chat.participants
      .find(p => p.user_id !== currentUserId)?.users;
      
    return {
      src: otherParticipant?.avatar_url || null,
      fallback: otherParticipant?.full_name.substring(0, 2).toUpperCase() || '?'
    };
  };
  
  const getLastMessagePreview = () => {
    return chat.last_message && chat.last_message.length > 30
      ? chat.last_message.substring(0, 30) + '...'
      : chat.last_message || 'No messages yet';
  };

  const avatarInfo = getAvatarInfo();
  
  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-colors flex items-center gap-3 ${
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-gray-100"
      }`}
      onClick={onSelect}
    >
      <Avatar>
        <AvatarImage src={avatarInfo.src || ""} />
        <AvatarFallback>{avatarInfo.fallback}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className={`font-medium truncate ${isSelected ? "text-primary" : ""}`}>
            {getChatName()}
          </h3>
          <span className="text-xs text-gray-500">
            {new Date(chat.updated_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {getLastMessagePreview()}
        </p>
      </div>
    </div>
  );
};

export default ChatItem;
