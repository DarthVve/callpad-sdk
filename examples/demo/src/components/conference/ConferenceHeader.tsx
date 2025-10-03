import { useAuth } from '../../hooks/useAuth';
import { useCallTimer } from '../../hooks/useCallTimer';
import './ConferenceHeader.css';

interface ConferenceHeaderProps {
  onMinimize?: () => void;
  onFullscreen?: () => void;
}

export function ConferenceHeader({ onMinimize, onFullscreen }: ConferenceHeaderProps) {
  const { user, logout } = useAuth();
  const { formattedDuration, isActive } = useCallTimer();

  return (
    <div className="conference-header">
      <div className="header-left">
        <div className="app-logo">
          <span className="logo-icon">📞</span>
          <span className="logo-text">CallPad</span>
        </div>
        
        {isActive && (
          <div className="call-status">
            <div className="status-indicator active"></div>
            <span className="status-text">Call duration: {formattedDuration}</span>
          </div>
        )}
      </div>

      <div className="header-center">
        {user && (
          <div className="user-info">
            <span className="user-name">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </span>
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.email || 'User'} className="user-avatar" />
            )}
            {!user.avatarUrl && (
              <div className="user-avatar-fallback">
                {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="window-controls">
          <button 
            className="window-control minimize"
            onClick={onMinimize}
            title="Minimize"
          >
            −
          </button>
          <button 
            className="window-control fullscreen"
            onClick={onFullscreen}
            title="Fullscreen"
          >
            ⚏
          </button>
          <button 
            className="window-control logout"
            onClick={logout}
            title="Logout"
          >
            ⚑
          </button>
        </div>
      </div>
    </div>
  );
}