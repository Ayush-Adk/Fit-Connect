
-- Create chats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Create chat_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  is_ai_suggestion BOOLEAN DEFAULT false,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  status TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create friend_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Chats policies
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chats they participate in" ON public.chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Chat_participants policies
CREATE POLICY "Users can view chat participants" ON public.chat_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can add chat participants" ON public.chat_participants
  FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in chats they participate in" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in chats they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Friend_requests policies
CREATE POLICY "Users can view their own friend requests" ON public.friend_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can create friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Users can update friend requests they're involved in" ON public.friend_requests
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );
