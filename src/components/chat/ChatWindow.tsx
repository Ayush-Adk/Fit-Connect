
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Send, Lightbulb, Smile, Video, Phone, Code, 
  Paperclip, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  chat_id: string;
  read_by: string[];
  type: string;
  is_ai_suggestion?: boolean;
}

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

const EMOJI_LIST = [
  "😊", "😂", "❤️", "👍", "🎉", "🔥", "👋", "✨", "👏", "🙏",
  "😎", "🤔", "😢", "😍", "👌", "🥳", "🚀", "💯", "🙌", "🤗"
];

const ChatWindow = ({ chatId, currentUserId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio" | "code" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  const markMessagesAsRead = async () => {
    try {
      // Get all unread messages sent by others
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('chat_id', chatId)
        .neq('sender_id', currentUserId)
        .not('read_by', 'cs', `{${currentUserId}}`);
      
      if (fetchError) throw fetchError;
      if (!unreadMessages || unreadMessages.length === 0) return;
      
      // Update each message's read_by array
      for (const message of unreadMessages) {
        const updatedReadBy = message.read_by ? [...message.read_by, currentUserId] : [currentUserId];
        
        await supabase
          .from('messages')
          .update({ read_by: updatedReadBy })
          .eq('id', message.id);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const getSuggestion = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          action: 'suggest',
          data: {
            messages: messages.slice(-5),
            chatContext: { currentUser: currentUserId }
          }
        }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        setNewMessage(data.suggestion);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          chat_id: chatId,
          sender_id: currentUserId,
          content: newMessage,
          is_ai_suggestion: suggestion === newMessage,
          type: 'text',
          read_by: [currentUserId]
        });

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      // Update the last_message in the chat
      await supabase
        .from('chats')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      setNewMessage("");
      setSuggestion(null);
    } catch (error: any) {
      toast.error("Failed to send message: " + error.message);
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const startCall = (type: "video" | "audio" | "code") => {
    setCallType(type);
    setIsInCall(true);
    
    // In a real app, you would initialize the call here
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} call started!`);
    
    // For demo purposes, send a system message about the call
    const callMessages = {
      video: "Started a video call",
      audio: "Started an audio call",
      code: "Started a code collaboration session"
    };
    
    supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        content: callMessages[type],
        type: 'system',
        read_by: [currentUserId]
      });
  };

  const endCall = () => {
    setIsInCall(false);
    setCallType(null);
    toast.info("Call ended");
    
    // Send system message about call ending
    supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        content: "Call ended",
        type: 'system',
        read_by: [currentUserId]
      });
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender_id === currentUserId;
    const isSystemMessage = message.type === 'system';
    
    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-600 rounded-full px-4 py-1 text-xs">
            {message.content}
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={message.id}
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <span className="text-xs mt-1 opacity-70 block text-right">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Call UI overlay */}
      {isInCall && (
        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-white">
          <div className="text-2xl mb-4">
            {callType === "video" && "Video Call"}
            {callType === "audio" && "Audio Call"}
            {callType === "code" && "Code Collaboration"}
          </div>
          
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-8">
            {callType === "video" && <Video className="w-8 h-8" />}
            {callType === "audio" && <Phone className="w-8 h-8" />}
            {callType === "code" && <Code className="w-8 h-8" />}
          </div>
          
          <Button 
            variant="destructive" 
            onClick={endCall}
            className="rounded-full px-8"
          >
            End Call
          </Button>
        </div>
      )}

      {/* Chat header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <DialogTitle className="font-medium">Chat</DialogTitle>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => startCall("audio")}
            title="Audio call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => startCall("video")}
            title="Video call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => startCall("code")}
            title="Code collaboration"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
        </div>
      </ScrollArea>

      {/* Message input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getSuggestion}
            disabled={loading}
            title="Get AI suggestion"
          >
            <Lightbulb className="h-5 w-5" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Insert emoji"
              >
                <Smile className="h-5 w-5" />
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
            size="icon"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
