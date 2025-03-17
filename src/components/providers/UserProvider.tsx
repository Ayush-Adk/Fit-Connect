
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type User = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        const authUser = sessionData.session.user;
        const userProfile = await fetchUserProfile(authUser.id);
        
        if (userProfile) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || ''
            });
          }
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
