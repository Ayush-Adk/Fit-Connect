
import { Loader2 } from "lucide-react";

const FriendsLoading = () => {
  return (
    <div className="flex justify-center p-2">
      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
    </div>
  );
};

export default FriendsLoading;
