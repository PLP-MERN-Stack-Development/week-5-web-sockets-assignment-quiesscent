import React, { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Rooms from './pages/Rooms'
import { useAuth } from './hooks/useAuth'
import './index.css'

function MainApp() {
  const { user } = useAuth()
  const [showRegister, setShowRegister] = React.useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white/80 rounded-xl shadow-lg p-8">
        {showRegister ? (
          <>
            <Register />
            <p className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setShowRegister(false)}>Login</button>
            </p>
          </>
        ) : (
          <>
            <Login />
            <p className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setShowRegister(true)}>Register</button>
            </p>
          </>
        )}
      </div>
    )
  }
  return <Rooms />
}

function App() {
  useEffect(() => {
    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Play sound for new messages
    window.playChatSound = () => {
      const audio = new Audio('/notification.mp3');
      audio.play();
    };
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <MainApp />
        </div>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
