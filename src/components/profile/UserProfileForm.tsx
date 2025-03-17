
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { User, Upload, Check } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  first_name: string | null;
  last_name: string | null;
}

const UserProfileForm = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile);
      setPreviewUrl(objectUrl);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [avatarFile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to edit your profile");
        return;
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('bio, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Combine user and profile data
      const combinedProfile = {
        id: user.id,
        full_name: userData?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: userData?.avatar_url,
        bio: profileData?.bio || '',
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
      };

      setProfile(combinedProfile);
      setFirstName(combinedProfile.first_name || '');
      setLastName(combinedProfile.last_name || '');
      setBio(combinedProfile.bio || '');
      setAvatarUrl(combinedProfile.avatar_url);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be smaller than 2MB");
        return;
      }
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile) return avatarUrl;
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error: any) {
      toast.error("Error uploading avatar: " + error.message);
      return null;
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }
      
      // Update full name
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Update user record
      if (fullName || newAvatarUrl !== avatarUrl) {
        const updates = {
          ...(fullName ? { full_name: fullName } : {}),
          ...(newAvatarUrl !== avatarUrl ? { avatar_url: newAvatarUrl } : {})
        };
        
        if (Object.keys(updates).length > 0) {
          const { error: userError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', profile.id);
            
          if (userError) throw userError;
        }
      }
      
      // Update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          first_name: firstName,
          last_name: lastName,
          bio: bio,
          updated_at: new Date().toISOString()
        });
        
      if (profileError) throw profileError;
      
      toast.success("Profile updated successfully");
      loadProfile(); // Reload profile to get updated data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Your Profile</CardTitle>
        <CardDescription>
          Update your profile information and avatar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewUrl || avatarUrl || ""} alt="Profile" />
              <AvatarFallback className="text-2xl">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2 items-center">
              <Label 
                htmlFor="avatar-upload" 
                className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-secondary/80"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Label>
              <Input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              {previewUrl && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setAvatarFile(null);
                  setPreviewUrl(null);
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
          {!saving && <Check className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserProfileForm;
