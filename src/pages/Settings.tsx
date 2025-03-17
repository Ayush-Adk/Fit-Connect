
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AccountSettings from "@/components/settings/AccountSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { UserSettings } from "@/types/settings";
import ActivityLogs from "@/components/settings/ActivityLogs";
import UserProfileForm from "@/components/profile/UserProfileForm";
import SocialMediaConnections from "@/components/settings/SocialMediaConnections";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadUserSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default settings
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            user_id: user.id,
            notifications_enabled: true,
            sleep_tracking_enabled: true,
            nutrition_tracking_enabled: true,
            theme: 'light',
            language: 'en'
          };

          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert(defaultSettings)
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (settings) {
        setSettings({ ...settings, ...updates });
      }
      toast.success("Settings updated successfully");

      // Apply theme change immediately
      if (updates.theme) {
        document.documentElement.className = updates.theme;
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="account" className="space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings settings={settings} onUpdateSettings={updateSettings} />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfileForm />
        </TabsContent>
        
        <TabsContent value="social">
          <SocialMediaConnections />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings settings={settings} onUpdateSettings={updateSettings} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings settings={settings} onUpdateSettings={updateSettings} />
        </TabsContent>

        <TabsContent value="friends">
          <FriendRequests />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
