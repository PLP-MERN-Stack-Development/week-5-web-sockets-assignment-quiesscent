import React, { useState } from 'react';
import { register } from '../api/auth';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await register(username, password);
      setSuccess(true);
      setUsername('');
      setPassword('');
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-gray-900 text-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-2">Register</h2>
      {success && <div className="text-green-400 text-center">Registration successful! You can now log in.</div>}
      {error && <div className="text-red-400 text-center">{error}</div>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-white placeholder-gray-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-white placeholder-gray-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
