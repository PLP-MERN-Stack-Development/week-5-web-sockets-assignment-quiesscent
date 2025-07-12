import { useState, useEffect } from 'react';
import { fetchMessages } from '../api/messages';
import { useAuth } from './useAuth';

export function useMessages(room) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!user || !room) return;
    fetchMessages(room, user.token)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [room, user]);
  return [messages, setMessages];
}
