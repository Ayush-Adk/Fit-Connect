
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { UserSettings } from "@/types/settings";

interface AccountSettingsProps {
  settings: UserSettings | null;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const AccountSettings = ({ settings, onUpdateSettings }: AccountSettingsProps) => {
  const [newPassword, setNewPassword] = useState("");

  const updatePassword = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account preferences and security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Change Password</h3>
          <div className="flex gap-4">
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button onClick={updatePassword}>Update Password</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Theme</h3>
          <div className="flex items-center gap-4">
            <Button
              variant={settings?.theme === "light" ? "default" : "outline"}
              onClick={() => onUpdateSettings({ theme: "light" })}
            >
              Light
            </Button>
            <Button
              variant={settings?.theme === "dark" ? "default" : "outline"}
              onClick={() => onUpdateSettings({ theme: "dark" })}
            >
              Dark
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;
