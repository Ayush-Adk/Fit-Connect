
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserSettings } from "@/types/settings";

interface NotificationSettingsProps {
  settings: UserSettings | null;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const NotificationSettings = ({ settings, onUpdateSettings }: NotificationSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage your notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Enable Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive notifications about important updates
              </p>
            </div>
            <Switch
              checked={settings?.notifications_enabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ notifications_enabled: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
