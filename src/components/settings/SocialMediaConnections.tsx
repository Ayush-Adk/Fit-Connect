
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Twitter, Headphones, Link, Linkedin, Github } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  spotify?: string;
  website?: string;
  [key: string]: string | undefined; // Add index signature here
}

const SocialMediaConnections = () => {
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [spotify, setSpotify] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingConnections();
  }, []);

  const loadExistingConnections = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('social_links')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData?.social_links) {
        const socialLinks = profileData.social_links as SocialLinks;
        if (socialLinks.instagram) setInstagram(socialLinks.instagram);
        if (socialLinks.twitter) setTwitter(socialLinks.twitter);
        if (socialLinks.linkedin) setLinkedin(socialLinks.linkedin);
        if (socialLinks.github) setGithub(socialLinks.github);
        if (socialLinks.spotify) setSpotify(socialLinks.spotify);
        if (socialLinks.website) setWebsite(socialLinks.website);
      }
    } catch (error) {
      console.error("Error loading social connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    let username;
    
    switch (platform) {
      case 'instagram':
        username = instagram;
        break;
      case 'twitter':
        username = twitter;
        break;
      case 'linkedin':
        username = linkedin;
        break;
      case 'github':
        username = github;
        break;
      case 'spotify':
        username = spotify;
        break;
      case 'website':
        username = website;
        break;
      default:
        return;
    }

    if (!username) {
      toast.error(`Please enter your ${platform} username or URL`);
      return;
    }

    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('social_links')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Update or create social media links
      let socialLinks = (profileData?.social_links || {}) as SocialLinks;
      socialLinks = {
        ...socialLinks,
        [platform]: username
      };

      // Update profile - fixed the type issue here
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          social_links: socialLinks as any, // Cast to any to bypass type checking temporarily
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`Connected to ${platform}!`);
      
      // Clear input
      switch (platform) {
        case 'instagram':
          setInstagram("");
          break;
        case 'twitter':
          setTwitter("");
          break;
        case 'linkedin':
          setLinkedin("");
          break;
        case 'github':
          setGithub("");
          break;
        case 'spotify':
          setSpotify("");
          break;
        case 'website':
          setWebsite("");
          break;
      }
      
      // Reload connections
      loadExistingConnections();
    } catch (error: any) {
      console.error("Failed to connect:", error);
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to enhance your profile and make it easier for friends to find you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-4 text-center">Loading your connections...</div>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <Instagram className="h-6 w-6 text-pink-500" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram username"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('instagram')}
                  disabled={isSaving || !instagram}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Twitter className="h-6 w-6 text-blue-400" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Twitter username"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('twitter')}
                  disabled={isSaving || !twitter}
                  className="bg-blue-400 hover:bg-blue-500"
                >
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Linkedin className="h-6 w-6 text-blue-600" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="LinkedIn profile URL"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('linkedin')}
                  disabled={isSaving || !linkedin}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Github className="h-6 w-6 text-gray-800" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="GitHub username"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('github')}
                  disabled={isSaving || !github}
                  variant="outline"
                  className="border-gray-800 text-gray-800 hover:bg-gray-100"
                >
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Headphones className="h-6 w-6 text-green-500" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="Spotify profile link"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('spotify')}
                  disabled={isSaving || !spotify}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link className="h-6 w-6 text-gray-600" />
              <div className="flex-1 flex gap-2">
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Your website URL"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleConnect('website')}
                  disabled={isSaving || !website}
                  variant="secondary"
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaConnections;
