
import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useUser } from "@/components/providers/UserProvider";
import { Loader2 } from "lucide-react";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { user, isLoading } = useUser();

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to view chats</div>;
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        onSelectChat={handleSelectChat}
      />
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} currentUserId={user.id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
