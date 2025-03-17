
import { MessageCircle } from "lucide-react";
import NewChatDialog from "./NewChatDialog";

interface SidebarHeaderProps {
  currentUserId: string;
  chats: Array<{
    id: string;
    type: string;
    name: string | null;
    created_at: string;
    updated_at: string;
    participants: {
      user_id: string;
      users: {
        full_name: string;
        avatar_url: string | null;
      };
    }[];
  }>;
  onSelectChat: (chatId: string) => void;
}

const SidebarHeader = ({ currentUserId, chats, onSelectChat }: SidebarHeaderProps) => {
  return (
    <div className="p-4 border-b bg-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2 text-primary" />
        Messages
      </h2>
      <div className="flex gap-2">
        <NewChatDialog 
          currentUserId={currentUserId} 
          chats={chats} 
          onSelectChat={onSelectChat} 
        />
      </div>
    </div>
  );
};

export default SidebarHeader;
