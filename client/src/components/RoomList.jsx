import React, { useEffect, useState } from 'react';
import { fetchRooms, createRoom } from '../api/rooms';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

export default function RoomList({ onSelect }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchRooms(user.token)
      .then(setRooms)
      .catch(() => setError('Failed to load rooms'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      socket.emit('joinRoom', { room: selectedRoom });
    }
  }, [selectedRoom, socket]);

  // Join the room when the parent (Rooms.jsx) changes the selected room
  useEffect(() => {
    if (onSelect && typeof onSelect === 'function') return; // parent handles join
    if (selectedRoom) {
      socket.emit('joinRoom', { room: selectedRoom });
    }
  }, [selectedRoom, socket, onSelect]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newRoom.trim();
    if (!trimmed) return;
    if (rooms.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Room already exists');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const room = await createRoom(trimmed, user.token);
      setRooms((prev) => [...prev, room]);
      setNewRoom('');
    } catch (err) {
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 w-80 min-w-[18rem] max-w-xs flex flex-col gap-4 mx-auto">
      <h3 className="text-lg font-bold mb-2 text-center">Rooms</h3>
      {loading && <div className="text-blue-400 text-center">Loading...</div>}
      {error && <div className="text-red-400 text-center">{error}</div>}
      <ul className="mb-2 flex-1 overflow-y-auto">
        {rooms.length === 0 && <li className="text-gray-400 text-center">No rooms yet.</li>}
        {rooms.map((room) => (
          <li key={room._id || room.name}>
            <button className="w-full block px-2 py-2 rounded hover:bg-blue-800 transition text-left" onClick={() => {
              onSelect && onSelect(room.name);
              setSelectedRoom(room.name);
              socket.emit('joinRoom', { room: room.name }); // Always join room on click
            }}>{room.name}</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          className="flex-1 border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={newRoom}
          onChange={e => { setNewRoom(e.target.value); setError(''); }}
          placeholder="New room name"
          disabled={loading}
        />
        <button
          className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition whitespace-nowrap disabled:bg-gray-600 disabled:cursor-not-allowed"
          style={{ minWidth: 0, width: 'auto' }}
          type="submit"
          disabled={loading || !newRoom.trim()}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}
