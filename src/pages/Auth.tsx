
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Key, User } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'username'>('email');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        // Create or update the user profile in our public users table
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            username: username || null,
            created_at: new Date().toISOString()
          });
          
        if (profileError) throw profileError;
      }
      
      toast.success("Signup successful! Please verify your email.");
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'email' && (!email || !password)) {
      toast.error("Please enter your email and password");
      return;
    }
    
    if (authMode === 'username' && (!username || !password)) {
      toast.error("Please enter your username and password");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let userEmail = email;
      
      // If using username login, need to fetch the email first
      if (authMode === 'username') {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', username)
          .single();
          
        if (userError) {
          throw new Error("Username not found. Please check and try again.");
        }
        
        userEmail = userData.email;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (error) throw error;
      
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Tabs 
                    defaultValue="email" 
                    className="w-full" 
                    onValueChange={(value) => setAuthMode(value as 'email' | 'username')}
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="email">Email</TabsTrigger>
                      <TabsTrigger value="username">Username</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="email">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="username">
                      <div className="space-y-2">
                        <Label htmlFor="signin-username">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-username"
                            placeholder="your_username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account? Switch to Sign Up
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Join our platform to connect with friends and share your activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-fullname"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username (optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-username"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account? Switch to Sign In
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
