
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import { UserProvider } from "./components/providers/UserProvider";

import { Toaster } from "@/components/ui/sonner";
import "./App.css";

const App = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
            <Route path="friends" element={<Friends />} />
            <Route path="chat" element={<Chat />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
};

export default App;
