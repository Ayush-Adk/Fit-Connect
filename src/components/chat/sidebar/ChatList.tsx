
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatItem from "./ChatItem";

interface ChatListProps {
  chats: Array<{
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
  }>;
  searchQuery: string;
  selectedChat: string | null;
  currentUserId: string;
  onSelectChat: (chatId: string) => void;
}

const ChatList = ({ 
  chats, 
  searchQuery, 
  selectedChat, 
  currentUserId, 
  onSelectChat 
}: ChatListProps) => {
  
  const getChatName = (chat: ChatListProps['chats'][0]) => {
    if (chat.type === 'group' && chat.name) return chat.name;
    const otherParticipant = chat.participants
      .find(p => p.user_id !== currentUserId)?.users;
    return otherParticipant?.full_name || 'Unknown User';
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    const chatName = getChatName(chat).toLowerCase();
    return chatName.includes(searchQuery.toLowerCase());
  });

  return (
    <ScrollArea className="flex-1 py-2">
      <div className="space-y-1 px-2">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatItem 
              key={chat.id}
              chat={chat}
              currentUserId={currentUserId}
              isSelected={selectedChat === chat.id}
              onSelect={() => onSelectChat(chat.id)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No conversations found</p>
            {!searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                Start a new chat or message a friend
              </p>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatList;
