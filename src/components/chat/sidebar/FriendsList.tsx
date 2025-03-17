
import FriendCard from "./FriendCard";

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface FriendsListProps {
  friends: Friend[];
  onFriendClick: (friendId: string) => void;
}

const FriendsList = ({ friends, onFriendClick }: FriendsListProps) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          id={friend.id}
          fullName={friend.full_name}
          avatarUrl={friend.avatar_url}
          onClick={onFriendClick}
        />
      ))}
    </div>
  );
};

export default FriendsList;
