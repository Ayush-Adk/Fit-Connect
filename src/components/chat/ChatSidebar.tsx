
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MessageSquarePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createNewChat } from "./sidebar/CreateChatUtils";
import RecentFriends from "./sidebar/RecentFriends";
import { useUser } from "@/components/providers/UserProvider";

interface Chat {
  id: string;
  name: string;
  type: string;
  last_message: string;
  last_message_at: string;
  participants: { user_id: string }[];
  created_at: string;
}

interface ChatSidebarProps {
  onSelectChat: (chatId: string) => void;
}

const ChatSidebar = ({ onSelectChat }: ChatSidebarProps) => {
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchChats();
  }, [user]);

  useEffect(() => {
    // Filter chats based on search term
    if (searchTerm) {
      const filtered = chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchTerm, chats]);

  const fetchChats = async () => {
    if (!user) return;
    
    try {
      setIsLoadingChats(true);
      
      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);
        
      if (participantsError) throw participantsError;
      
      if (chatParticipants && chatParticipants.length > 0) {
        const chatIds = chatParticipants.map(p => p.chat_id);
        
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('last_message_at', { ascending: false });
          
        if (chatsError) throw chatsError;
        
        if (chatsData) {
          // Fetch participants for each chat
          const chatsWithParticipants = await Promise.all(chatsData.map(async (chat) => {
            const { data: participantsData, error: participantsError } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id);
              
            if (participantsError) {
              console.error("Error fetching chat participants:", participantsError);
              return {
                ...chat,
                participants: [] // Ensure participants is always defined
              };
            }
            
            return {
              ...chat,
              participants: participantsData || []
            };
          }));
          
          setChats(chatsWithParticipants as Chat[]);
          setFilteredChats(chatsWithParticipants as Chat[]);
        }
      } else {
        setChats([]);
        setFilteredChats([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to load chats");
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openNewChatDialog = () => {
    setIsNewChatDialogOpen(true);
  };

  const closeNewChatDialog = () => {
    setIsNewChatDialogOpen(false);
  };

  const onNewChatCreated = (chatId: string) => {
    fetchChats();
    onSelectChat(chatId);
  };

  const SidebarHeader = () => (
    <div className="px-4 py-3 border-b">
      <h1 className="text-lg font-semibold">Messages</h1>
    </div>
  );

  const SearchBar = ({ onSearch }: { onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="px-4 py-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search chats..."
          className="pl-9"
          onChange={onSearch}
        />
      </div>
    </div>
  );

  const ChatListItem = ({ chat }: { chat: Chat }) => {
    const isGroupChat = chat.type === 'group';
    const chatName = isGroupChat ? chat.name : "Direct Message";
    const lastMessage = chat.last_message || "No messages yet";
    const otherUserId = chat.participants?.find(p => p.user_id !== user?.id)?.user_id;
    const [otherUser, setOtherUser] = useState<any>(null);
    
    useEffect(() => {
      const fetchOtherUser = async () => {
        if (otherUserId) {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();
            
          if (error) {
            console.error("Error fetching other user:", error);
            return;
          }
          
          setOtherUser(data);
        }
      };
      
      fetchOtherUser();
    }, [otherUserId]);
    
    return (
      <Button
        variant="ghost"
        className="flex items-center space-x-3 w-full hover:bg-gray-100 dark:hover:bg-gray-800 justify-start"
        onClick={() => onSelectChat(chat.id)}
      >
        <Avatar className="h-9 w-9">
          {otherUser?.avatar_url ? (
            <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.full_name} />
          ) : (
            <AvatarFallback>{otherUser?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col truncate">
          <span className="text-sm font-medium line-clamp-1">{chatName}</span>
          <span className="text-xs text-gray-500 line-clamp-1">{lastMessage}</span>
        </div>
      </Button>
    );
  };

  const NewChatDialog = ({ open, onOpenChange, currentUserId, onChatCreated }: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    currentUserId: string, 
    onChatCreated: (chatId: string) => void 
  }) => {
    const [friendId, setFriendId] = useState("");
    const [isCreatingChat, setIsCreatingChat] = useState(false);
  
    const handleCreateChat = async () => {
      if (!friendId) {
        toast.error("Please enter a friend ID");
        return;
      }
  
      try {
        setIsCreatingChat(true);
        
        const result = await createNewChat('direct', null, [friendId], currentUserId);
        
        if (result.error) {
          throw result.error;
        }
        
        if (result.chatId) {
          onChatCreated(result.chatId);
          toast.success("Chat created successfully!");
          onOpenChange(false);
        }
      } catch (error: any) {
        console.error("Error creating chat:", error);
        toast.error(`Failed to create chat: ${error.message}`);
      } finally {
        setIsCreatingChat(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Chat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="friend-id" className="text-right">
                Friend ID
              </Label>
              <Input
                id="friend-id"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleCreateChat} disabled={isCreatingChat}>
            {isCreatingChat ? "Creating..." : "Create Chat"}
          </Button>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="h-full flex flex-col border-r">
      <SidebarHeader />
      
      <SearchBar onSearch={handleSearch} />
      
      <div className="px-4 py-2">
        <h2 className="text-sm font-semibold mb-2">Recent Friends</h2>
        <RecentFriends 
          currentUserId={user?.id || ""} 
          onSelectChat={onSelectChat} 
        />
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <h2 className="px-4 text-sm font-semibold mb-2">Chats</h2>
        {isLoadingChats ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : filteredChats && filteredChats.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="px-4 py-2 text-center text-sm text-gray-500">
            No chats found. Start a new conversation!
          </div>
        )}
      </div>
      
      <div className="p-4 mt-auto">
        <Button onClick={openNewChatDialog} className="w-full">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <NewChatDialog 
        open={isNewChatDialogOpen} 
        onOpenChange={setIsNewChatDialogOpen} 
        currentUserId={user?.id || ""}
        onChatCreated={onNewChatCreated}
      />
    </div>
  );
};

export default ChatSidebar;
