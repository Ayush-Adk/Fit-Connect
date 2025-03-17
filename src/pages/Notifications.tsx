import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, UserPlus, MessageSquare, Bell, Heart, MessageCircle, Image } from "lucide-react";

interface NotificationSender {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Notification {
  id: string;
  type: string;
  content: string;
  user_id: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: NotificationSender | null;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) return;

      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each notification
      const notificationsWithSender = await Promise.all((notificationsData || []).map(async (notification) => {
        // For notifications with a related_id (usually the sender of a friend request, like, comment)
        if (notification.related_id) {
          // For post_like and post_comment, the related_id is the post ID
          if (notification.type === 'post_like' || notification.type === 'post_comment') {
            // First get the post like or comment details
            const { data: actionData } = notification.type === 'post_like' 
              ? await supabase
                  .from('post_likes')
                  .select('user_id')
                  .eq('post_id', notification.related_id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single()
              : await supabase
                  .from('post_comments')
                  .select('user_id')
                  .eq('post_id', notification.related_id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                  
            if (actionData) {
              // Then get the user details
              const { data: senderData } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', actionData.user_id)
                .single();
                
              return {
                ...notification,
                sender: senderData || null
              };
            }
          } else {
            // For other notifications like friend requests, the related_id is the user ID
            const { data: senderData } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', notification.related_id)
              .single();
              
            return {
              ...notification,
              sender: senderData || null
            };
          }
        }
        
        return {
          ...notification,
          sender: null
        };
      }));

      setNotifications(notificationsWithSender.filter(Boolean));
    } catch (error: any) {
      console.error('Error fetching notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const acceptFriendRequest = async (notification: Notification) => {
    if (!notification.related_id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update friend request status
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('sender_id', notification.related_id)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      // Create a notification for the sender
      await supabase
        .from('notifications')
        .insert({
          user_id: notification.related_id,
          type: 'friend_accepted',
          content: 'accepted your friend request',
          related_id: user.id
        });

      toast.success('Friend request accepted');
      fetchNotifications();
    } catch (error: any) {
      toast.error('Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (notification: Notification) => {
    if (!notification.related_id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete the friend request
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('sender_id', notification.related_id)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      toast.success('Friend request declined');
      fetchNotifications();
    } catch (error: any) {
      toast.error('Failed to decline friend request');
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    if (!notification.sender) {
      return <p>{notification.content}</p>;
    }

    switch (notification.type) {
      case 'friend_request':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              {notification.content}
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => acceptFriendRequest(notification)}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => declineFriendRequest(notification)}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        );
      case 'friend_accepted':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              {notification.content}
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Navigate to messages
                  window.location.href = '/messages';
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
            </div>
          </div>
        );
      case 'chat_created':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              {notification.content}
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => {
                  // Navigate to messages
                  window.location.href = '/messages';
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Open Chat
              </Button>
            </div>
          </div>
        );
      case 'story_view':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              viewed your story
            </p>
          </div>
        );
      case 'post_like':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              liked your post
            </p>
          </div>
        );
      case 'post_comment':
        return (
          <div className="flex flex-col">
            <p>
              <span className="font-medium">{notification.sender.full_name}</span>{' '}
              commented on your post: "{notification.content}"
            </p>
          </div>
        );
      default:
        return (
          <p>
            <span className="font-medium">{notification.sender?.full_name}</span>{' '}
            {notification.content}
          </p>
        );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'friend_accepted':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'message':
      case 'chat_created':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'story_view':
        return <Image className="h-5 w-5 text-pink-500" />;
      case 'post_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'post_comment':
        return <MessageCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Badge variant="destructive">{unreadCount} new</Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg ${
                      notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {notification.sender ? (
                        <Avatar>
                          <AvatarImage src={notification.sender.avatar_url || ""} />
                          <AvatarFallback>
                            {notification.sender.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      <div className="flex-1">
                        {renderNotificationContent(notification)}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No notifications yet</h3>
              <p className="text-gray-500 mt-1">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
