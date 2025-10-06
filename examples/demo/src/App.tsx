import './App.css'
import { useState } from 'react'
import { RtcProvider } from '@voyatek/callpad-sdk'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { AuthService } from './services/auth.service'
import { LoginForm } from './components/auth/LoginForm'
import { CallInitiator } from './components/calling/CallInitiator'
import { VideoConference } from './components/conference/VideoConference'
import { IncomingCallModal } from './components/calling/IncomingCallModal'
import { CallNotifications } from './components/calling/CallNotifications'
import { MinimizedCall } from './components/calling/MinimizedCall'
import { useCallState } from '@voyatek/callpad-sdk'

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('  VITE_SIGNAL_HOST:', import.meta.env.VITE_SIGNAL_HOST);
console.log('  VITE_LIVEKIT_URL:', import.meta.env.VITE_LIVEKIT_URL);
console.log('  VITE_DEBUG:', import.meta.env.VITE_DEBUG);

const signalHost = import.meta.env.VITE_SIGNAL_HOST || 'http://localhost:3001';
console.log('🚀 Final signalHost:', signalHost);

const rtcOptions = {
  appId: 'callpad-demo',
  signalHost,
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880',
  authProvider: () => AuthService.getToken(),
  log: (level: string, message: string, extra?: any) => {
    if (import.meta.env.VITE_DEBUG) {
      console.log(`[${level.toUpperCase()}] ${message}`, extra);
    }
  },
}

function AppContent() {
  const { status } = useCallState()
  const [isCallMinimized, setIsCallMinimized] = useState(false)
  
  const handleCallInitiated = () => {
    // The call will automatically progress through states via the SDK
    console.log('Call initiated successfully')
  }

  const handleLeaveCall = () => {
    // Return to call initiator after leaving
    setIsCallMinimized(false)
    console.log('Left call, returning to initiator')
  }

  const handleMinimizeCall = () => {
    setIsCallMinimized(true)
  }

  const handleRestoreCall = () => {
    setIsCallMinimized(false)
  }

  const inCall = status !== 'IDLE' && status !== 'ENDED'

  return (
    <>
      {/* Show video conference when call is active/connecting and not minimized */}
      {inCall && !isCallMinimized && (
        <VideoConference 
          onLeaveCall={handleLeaveCall}
          onMinimize={handleMinimizeCall}
        />
      )}

      {/* Show call initiator when idle/ended or when call is minimized */}
      {(!inCall || isCallMinimized) && (
        <CallInitiator onCallInitiated={handleCallInitiated} />
      )}

      {/* Show minimized call widget when call is active and minimized */}
      {inCall && isCallMinimized && (
        <MinimizedCall
          onRestore={handleRestoreCall}
          onLeaveCall={handleLeaveCall}
        />
      )}
    </>
  )
}

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <RtcProvider options={rtcOptions}>
      <div className="app">
        <AppContent />
        <IncomingCallModal />
        <CallNotifications />
      </div>
    </RtcProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App