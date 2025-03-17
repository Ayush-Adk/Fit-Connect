
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "@/types/settings";
import { toast } from "sonner";

const ActivityLogs = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivityLogs();
    subscribeToActivityLogs();
  }, []);

  const subscribeToActivityLogs = () => {
    const channel = supabase
      .channel('account-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'account_activity'
        },
        () => {
          loadActivityLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadActivityLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('account_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) as { data: Activity[] | null; error: Error | null };

      if (error) throw error;
      if (data) {
        setActivities(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Activity</CardTitle>
        <CardDescription>Recent activity on your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-2 border-b"
            >
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-500">{activity.ip_address || 'Unknown'}</p>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-center text-gray-500">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
