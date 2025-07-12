import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

// Accept MessageInput as a child for composition
export default function MessageList({ room, isActive, unread, setUnread, children }) {
  const [messages, setMessages] = useMessages(room);
  const { user } = useAuth();
  const socket = useSocket();
  const bottomRef = useRef(null);
  const [reactingTo, setReactingTo] = useState(null);

  // Join the room on mount
  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('joinRoom', { room });
  }, [socket, room]);

  // Listen for real-time reaction updates
  useEffect(() => {
    if (!socket) return;
    const handler = ({ messageId, reaction, user: reactUser }) => {
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), { reaction, user: reactUser }],
              }
            : msg
        )
      );
    };
    socket.on('reaction', handler);
    return () => socket.off('reaction', handler);
  }, [socket, setMessages]);

  // Listen for real-time chat messages (including own messages)
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      console.log('Received chatMessage:', msg); // Debug log
      // Only add if message is for this room
      if (msg.room === room) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('chatMessage', handler);
    return () => socket.off('chatMessage', handler);
  }, [socket, room, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleReact = (messageId, reaction) => {
    socket.emit('reaction', { messageId, reaction });
    setReactingTo(null);
  };

  // Group reactions by emoji and show who reacted
  function groupReactions(reactions = []) {
    const grouped = {};
    reactions.forEach((r) => {
      if (!grouped[r.reaction]) grouped[r.reaction] = [];
      grouped[r.reaction].push(r.user?.username || 'Unknown');
    });
    return grouped;
  }

  // Notification for new messages and unread count
  useEffect(() => {
    if (!socket) return;
    // Listen for new chat messages for notifications and sound
    const handler = (msg) => {
      // Only notify if not your own message
      if (msg.userId !== user?.userId) {
        // Browser notification
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(`New message from ${msg.user || msg.from?.username || 'Unknown'}`, {
            body: msg.message || msg.content,
            icon: '/vite.svg',
          });
        }
        // Sound notification
        if (window.playChatSound) window.playChatSound();
        // Unread count (now handled by parent)
        if (!isActive && setUnread) setUnread((u) => u + 1);
      }
    };
    socket.on('chatMessage', handler);
    return () => socket.off('chatMessage', handler);
  }, [socket, user, isActive, setUnread]);

  // Reset unread count when room becomes active
  useEffect(() => {
    if (isActive && setUnread) setUnread(0);
  }, [isActive, setUnread]);

  if (!room) return null;
  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 flex flex-col gap-2 min-h-[180px]">
      {unread > 0 && !isActive && (
        <div className="text-xs text-white bg-red-600 rounded-full px-2 py-1 mb-2 w-fit mx-auto animate-bounce">
          {unread} unread message{unread > 1 ? 's' : ''}
        </div>
      )}
      {messages.length === 0 && (
        <div className="text-gray-400 text-center mb-2">No messages yet. Start the conversation below!</div>
      )}
      <div className="flex-1 max-h-80 overflow-y-auto min-h-[80px] flex flex-col gap-2">
        {messages.map((msg) => {
          const grouped = groupReactions(msg.reactions);
          return (
            <div
              key={msg._id || Math.random()}
              className={`mb-1 px-2 py-1 rounded bg-gray-800/80 flex flex-col ${msg.from?.userId === user?.userId ? 'items-end' : 'items-start'}`}
            >
              <span className="text-xs text-blue-300 font-semibold mb-1">{msg.from?.username || 'Unknown'}</span>
              <span className="text-base">{msg.content}</span>
              <div className="flex gap-2 mt-1 items-center flex-wrap">
                {/* Show grouped reactions with usernames */}
                {Object.entries(grouped).map(([emoji, users]) => (
                  <span key={emoji} className="text-sm bg-gray-700 rounded px-2 py-1 flex items-center gap-1" title={users.join(', ')}>
                    {emoji} <span className="text-xs text-gray-300">({users.length})</span>
                    <span className="ml-1 text-xs text-blue-200">{users.join(', ')}</span>
                  </span>
                ))}
                {/* Add reaction button */}
                <button
                  className="ml-2 text-xs text-gray-400 hover:text-blue-400"
                  onClick={() => setReactingTo(msg._id)}
                >
                  {reactingTo === msg._id ? 'Pick:' : 'React'}
                </button>
                {reactingTo === msg._id && (
                  <div className="flex gap-1 ml-2 bg-gray-700 rounded px-2 py-1">
                    {REACTIONS.map((r) => (
                      <button
                        key={r}
                        className="hover:scale-125 transition text-lg"
                        onClick={() => handleReact(msg._id, r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Message input always shown at the bottom */}
      <div className="mt-2">{children}</div>
    </div>
  );
}
