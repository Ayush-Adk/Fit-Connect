
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserSettings } from "@/types/settings";

interface PrivacySettingsProps {
  settings: UserSettings | null;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const PrivacySettings = ({ settings, onUpdateSettings }: PrivacySettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control your privacy preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sleep Tracking</h3>
              <p className="text-sm text-gray-500">
                Enable sleep tracking features
              </p>
            </div>
            <Switch
              checked={settings?.sleep_tracking_enabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ sleep_tracking_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Nutrition Tracking</h3>
              <p className="text-sm text-gray-500">
                Enable nutrition tracking features
              </p>
            </div>
            <Switch
              checked={settings?.nutrition_tracking_enabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ nutrition_tracking_enabled: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
