
import { Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Settings, Bell, MessageSquare, LogOut, Users } from "lucide-react";
import { toast } from "sonner";

const Layout = () => {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const navItems = [
    { path: "/", icon: <Home className="h-5 w-5" />, label: "Home" },
    { path: "/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
    { path: "/friends", icon: <Users className="h-5 w-5" />, label: "Friends" },
    { path: "/notifications", icon: <Bell className="h-5 w-5" />, label: "Notifications" },
    { path: "/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:top-0 md:bottom-auto">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 ${
                  location.pathname === item.path
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-blue-600"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs mt-1">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20 md:pb-4 md:pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
