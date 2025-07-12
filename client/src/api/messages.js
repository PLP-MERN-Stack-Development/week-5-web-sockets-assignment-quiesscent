// API for messages
export async function fetchMessages(room, token) {
  const res = await fetch(`/api/messages/${room}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}
