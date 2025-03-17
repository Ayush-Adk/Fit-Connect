
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
  return (
    <div className="p-3 border-b">
      <div className="flex items-center border rounded-md pl-3">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
};

export default SearchBar;
