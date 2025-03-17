
export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  sleep_tracking_enabled: boolean;
  nutrition_tracking_enabled: boolean;
  theme: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  action: string;
  created_at: string;
  ip_address: string | null;
  user_id: string;
}

