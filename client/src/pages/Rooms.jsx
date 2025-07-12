import React, { useState } from 'react';
import RoomList from '../components/RoomList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

export default function Rooms() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  // Track unread counts per room
  const [unreadCounts, setUnreadCounts] = useState({});

  // Helper to get/set unread for the selected room
  const unread = selectedRoom ? unreadCounts[selectedRoom] || 0 : 0;
  const setUnread = (count) => {
    if (!selectedRoom) return;
    setUnreadCounts((u) => ({ ...u, [selectedRoom]: count }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl mx-auto mt-10">
      <div>
        <RoomList onSelect={setSelectedRoom} />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        {selectedRoom && (
          <MessageList
            room={selectedRoom}
            unread={unread}
            setUnread={setUnread}
          >
            <MessageInput room={selectedRoom} />
          </MessageList>
        )}
        {!selectedRoom && (
          <div className="text-gray-400 text-center mt-16">
            Select a room to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
