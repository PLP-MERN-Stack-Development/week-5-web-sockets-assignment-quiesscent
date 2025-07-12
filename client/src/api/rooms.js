// API for rooms
export async function fetchRooms(token) {
  const res = await fetch('/api/rooms', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}
export async function createRoom(name, token) {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}
