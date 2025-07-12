import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

export default function MessageInput({ room }) {
  const [msg, setMsg] = useState('');
  const socket = useSocket();
  const { user } = useAuth();

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim() || !room) return;
    socket.emit('chatMessage', { msg, room });
    setMsg('');
  };

  return (
    <form onSubmit={sendMessage} className="flex gap-2 mt-2 bg-gray-900 rounded-xl shadow-lg p-4">
      <input
        className="flex-1 border border-gray-700 rounded px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={msg}
        onChange={e => setMsg(e.target.value)}
        placeholder="Type a message..."
        disabled={!user}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50" type="submit" disabled={!user || !room || !msg.trim()}>Send</button>
    </form>
  );
}
